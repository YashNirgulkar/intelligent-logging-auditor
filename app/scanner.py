import ast
import hashlib
from pathlib import Path

from app.schemas import Finding


RISK_CALLS = {
    "requests.get",
    "requests.post",
    "requests.put",
    "requests.delete",
    "httpx.get",
    "httpx.post",
    "httpx.put",
    "httpx.delete",
    "subprocess.run",
    "subprocess.Popen",
    "open",
    "connect",
    "execute",
}
LOG_METHODS = {"debug", "info", "warning", "error", "exception", "critical", "log"}


def dotted_name(node):
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        base = dotted_name(node.value)
        return f"{base}.{node.attr}" if base else node.attr
    return ""


def is_logging_call(node):
    if not isinstance(node, ast.Call):
        return False
    parts = dotted_name(node.func).split(".")
    return (
        len(parts) >= 2
        and ((parts[0] == "logging") or (parts[0] in {"logger", "log"}))
        and parts[-1] in LOG_METHODS
    )


def call_is_risky(node):
    name = dotted_name(node.func)
    return name in RISK_CALLS or (
        isinstance(node.func, ast.Attribute)
        and node.func.attr in {"read", "write", "commit", "rollback", "execute", "fetchone", "fetchall"}
    )


def make_id(path, line, rule):
    return hashlib.sha1(f"{path}:{line}:{rule}".encode()).hexdigest()[:12]


class Auditor(ast.NodeVisitor):
    def __init__(self, path):
        self.path, self.findings = path, []

    def visit_FunctionDef(self, node):
        self.inspect(node)
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node):
        self.inspect(node)
        self.generic_visit(node)

    def inspect(self, node):
        calls = [n for n in ast.walk(node) if isinstance(n, ast.Call)]
        risky = [n for n in calls if call_is_risky(n)]
        logs = any(is_logging_call(n) for n in calls)
        if risky and not logs:
            call = min(risky, key=lambda n: getattr(n, "lineno", 0))
            line = getattr(call, "lineno", node.lineno)
            self.findings.append(
                Finding(
                    id=make_id(self.path, line, "risky_without_logging"),
                    file_path=self.path,
                    line=line,
                    function_name=node.name,
                    risk="medium",
                    rule="risky_operation_without_logging",
                    title=f"Potential missing logging in `{node.name}`",
                    rationale=(
                        f"Function `{node.name}` contains `{dotted_name(call.func)}` but no "
                        "recognized logging call in the function. Heuristic only; review context."
                    ),
                    suggested_code=(
                        f'logger = logging.getLogger(__name__)\n'
                        f'logger.info("Starting {node.name}")\n'
                        "# Add context-specific error logging; never log secrets."
                    ),
                )
            )

        for handler in (n for n in ast.walk(node) if isinstance(n, ast.ExceptHandler)):
            body = [x for stmt in handler.body for x in ast.walk(stmt)]
            if not any(is_logging_call(x) for x in body) and not any(
                isinstance(x, ast.Raise) for x in body
            ):
                line = handler.lineno
                self.findings.append(
                    Finding(
                        id=make_id(self.path, line, "exception_without_log_or_reraise"),
                        file_path=self.path,
                        line=line,
                        function_name=node.name,
                        risk="high",
                        rule="exception_without_log_or_reraise",
                        title=f"Exception handler in `{node.name}` may hide a failure",
                        rationale=(
                            "This exception handler neither logs nor re-raises. "
                            "Confirm swallowing the exception is intentional."
                        ),
                        suggested_code=(
                            'logger.exception("Operation failed")\n'
                            "# Re-raise if this layer cannot safely recover."
                        ),
                    )
                )


def analyze_python_file(file_path, source):
    try:
        tree = ast.parse(source, filename=file_path)
    except (SyntaxError, ValueError) as exc:
        line = getattr(exc, "lineno", 1) or 1
        return [
            Finding(
                id=make_id(file_path, line, "parse_error"),
                file_path=file_path,
                line=line,
                function_name="<module>",
                risk="low",
                rule="parse_error",
                title="Python file could not be parsed",
                rationale=f"Static analysis skipped this file ({exc.__class__.__name__}).",
                suggested_code="# Fix syntax errors before auditing.",
            )
        ]

    visitor = Auditor(file_path)
    visitor.visit(tree)
    return list({finding.id: finding for finding in visitor.findings}.values())


def analyze_repository(root: Path):
    findings = []
    ignored = {".git", ".venv", "venv", "__pycache__", "node_modules"}
    for file in root.rglob("*.py"):
        if any(part in ignored for part in file.parts):
            continue
        try:
            if file.stat().st_size > 1_000_000:
                continue
            source = file.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        findings.extend(analyze_python_file(file.relative_to(root).as_posix(), source))
    return findings
