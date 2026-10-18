import ast
import hashlib
import logging
import re
from pathlib import Path

from app.schemas import Finding

logger = logging.getLogger(__name__)

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

# Non-Python analyzers use conservative source heuristics, so the audit service
# can inspect common repositories without installing a compiler per language.
JS_RULES = {
    "language": "JavaScript/TypeScript",
    "functions": r"(?:async\s+)?function\s+([\w$]+)\s*\(|(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>\s*\{",
    "risky": r"\b(?:fetch|axios\.(?:get|post|put|delete|request)|https?\.(?:get|request)|fs\.(?:read\w*|write\w*|open)|exec|spawn|query|execute)\s*(?:\.|\()",
}
LANGUAGE_RULES = {
    **{ext: JS_RULES for ext in (".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx")},
    ".java": {
        "language": "Java",
        "functions": r"(?:public|private|protected|static|final|synchronized|native|abstract|[\w<>.?\[\]]+\s+)+([A-Za-z_$]\w*)\s*\([^;{}]*\)\s*(?:throws\s+[\w., ]+)?\s*\{",
        "risky": r"\b(?:execute|executeQuery|executeUpdate|send|connect|openConnection|readAllBytes|Files\.(?:read\w*|write\w*)|\.getInputStream)\s*(?:\.|\()",
    },
    ".go": {
        "language": "Go",
        "functions": r"func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)\s*\(",
        "risky": r"\b(?:http\.(?:Get|Post|Do)|\.Do|os\.(?:Open|Create|ReadFile|WriteFile)|exec\.Command|\.Query(?:Context)?|\.Exec(?:Context)?)\s*\(",
    },
    ".cs": {
        "language": "C#",
        "functions": r"(?:public|private|protected|internal|static|async|virtual|override|sealed|[\w<>.?\[\]]+\s+)+([A-Za-z_]\w*)\s*\([^;{}]*\)\s*(?:=>\s*\{|\{)",
        "risky": r"\b(?:SendAsync|GetAsync|PostAsync|PutAsync|DeleteAsync|Execute(?:Reader|NonQuery|Scalar)?|File\.(?:Read\w*|Write\w*|Open)|Process\.Start)\s*(?:\.|\()",
    },
    ".php": {
        "language": "PHP",
        "functions": r"function\s*&?\s*([A-Za-z_]\w*)\s*\(",
        "risky": r"\b(?:curl_exec|file_get_contents|file_put_contents|fopen|mysqli_query|query|exec|shell_exec|proc_open)\s*\(",
    },
    ".rb": {
        "language": "Ruby",
        "functions": r"def\s+([\w!?=]+)",
        "risky": r"\b(?:Net::HTTP|open|read|write|system|exec|execute|query)\s*(?:\.|\()",
    },
    ".rs": {
        "language": "Rust",
        "functions": r"(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z_]\w*)\s*(?:<[^>]+>)?\s*\(",
        "risky": r"\b(?:reqwest::|\.send\s*\(|std::fs::|fs::(?:read|write)|Command::new|\.execute\s*\(|\.query\s*\()",
    },
}
LOG_CALL_RE = re.compile(
    r"(?:\bconsole\s*\.\s*(?:debug|info|log|warn|error|trace)\s*\(|"
    r"\b(?:logger|log|logging|slog)\s*\.\s*(?:debug|info|warning|warn|error|exception|critical|fatal|trace|log|Print|Printf|Println|Debug|Info|Warn|Error|LogTrace|LogDebug|LogInformation|LogWarning|LogError|LogCritical)\s*!?\s*\(|"
    r"\b(?:logger|log)\s*->\s*(?:debug|info|warning|warn|error|exception|critical|fatal|trace|log)\s*\(|"
    r"\b(?:tracing|slog)::?(?:debug|info|warn|error|trace)!\s*\(|"
    r"\b(?:debug|info|warn|error|trace)!\s*\(|"
    r"\b(?:error_log|Log::(?:debug|info|warning|error)|printStackTrace)\s*\()",
    re.IGNORECASE,
)


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
    owner_parts = {part.lower() for part in parts[:-1]}
    return len(parts) >= 2 and parts[-1] in LOG_METHODS and bool(
        owner_parts.intersection({"logging", "logger", "log"})
    )


def call_is_risky(node):
    name = dotted_name(node.func)
    return name in RISK_CALLS or (
        isinstance(node.func, ast.Attribute)
        and node.func.attr in {"read", "write", "commit", "rollback", "execute", "fetchone", "fetchall"}
    )


def make_id(path, line, rule):
    return hashlib.sha1(f"{path}:{line}:{rule}".encode()).hexdigest()[:12]


def _function_spans(source, pattern, extension):
    """Return approximate function bodies for brace-delimited source languages."""
    lines = source.splitlines()
    spans = []
    patterns = [pattern]
    if extension in {".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"}:
        patterns.append(
            r"^\s*(?:async\s+)?(?!(?:if|for|while|switch|catch|function)\b)"
            r"([A-Za-z_$]\w*)\s*\([^;{}]*\)\s*\{"
        )
    matches = sorted(
        (match for candidate in patterns for match in re.finditer(candidate, source, re.MULTILINE)),
        key=lambda match: match.start(),
    )
    for match in matches:
        name = next((group for group in match.groups() if group), None) or "<function>"
        start = match.start()
        start_line = source.count("\n", 0, start) + 1
        if extension == ".rb":
            indent = len(lines[start_line - 1]) - len(lines[start_line - 1].lstrip())
            end_line = len(lines)
            for index in range(start_line, len(lines)):
                line = lines[index]
                if line.strip().startswith("def ") and len(line) - len(line.lstrip()) <= indent:
                    end_line = index
                    break
            spans.append((start_line, max(start_line, end_line), name))
            continue

        opening = source.find("{", match.end())
        if opening < 0:
            end_line = source.count("\n", 0, match.end()) + 1
            spans.append((start_line, end_line, name))
            continue
        depth = 0
        end_offset = len(source)
        for offset in range(opening, len(source)):
            if source[offset] == "{":
                depth += 1
            elif source[offset] == "}":
                depth -= 1
                if depth == 0:
                    end_offset = offset + 1
                    break
        spans.append((start_line, source.count("\n", 0, end_offset) + 1, name))
    return spans


def analyze_other_language_file(file_path, source):
    extension = Path(file_path).suffix.lower()
    rules = LANGUAGE_RULES.get(extension)
    if not rules:
        return []

    lines = source.splitlines()
    spans = _function_spans(source, rules["functions"], extension)
    if not spans:
        spans = [(1, max(1, len(lines)), "<module>")]

    risky_pattern = re.compile(rules["risky"], re.IGNORECASE)
    findings = []
    seen = set()
    for start, end, name in spans:
        body = "\n".join(lines[start - 1 : end])
        if LOG_CALL_RE.search(body):
            continue
        for call in risky_pattern.finditer(body):
            line = start + body.count("\n", 0, call.start())
            key = (line, "risky_operation_without_logging")
            if key in seen:
                continue
            seen.add(key)
            marker = "#" if extension == ".rb" else "//"
            findings.append(
                Finding(
                    id=make_id(file_path, line, "risky_without_logging"),
                    file_path=file_path,
                    line=line,
                    function_name=name,
                    risk="medium",
                    rule="risky_operation_without_logging",
                    title=f"Potential missing logging in `{name}`",
                    rationale=(
                        f"{rules['language']} function `{name}` contains a recognized I/O or "
                        "external-operation call but no recognized logging call. "
                        "This is a source heuristic; review the surrounding code."
                    ),
                    suggested_code=(
                        f"{marker} Add context-specific logging for this operation; "
                        "never log secrets."
                    ),
                )
            )
    return findings


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
        logger.warning(
            "Python source could not be parsed; returning a parse-error finding file=%s line=%d error_type=%s",
            file_path,
            line,
            type(exc).__name__,
        )
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
    supported_extensions = {".py", *LANGUAGE_RULES}
    for file in root.rglob("*"):
        if not file.is_file() or file.suffix.lower() not in supported_extensions:
            continue
        if any(part in ignored for part in file.parts):
            continue
        try:
            if file.stat().st_size > 1_000_000:
                continue
            source = file.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            logger.warning(
                "Skipping unreadable source file during repository analysis file=%s error_type=%s",
                file.relative_to(root).as_posix(),
                type(exc).__name__,
            )
            continue
        relative_path = file.relative_to(root).as_posix()
        if file.suffix.lower() == ".py":
            findings.extend(analyze_python_file(relative_path, source))
        else:
            findings.extend(analyze_other_language_file(relative_path, source))
    return findings

