import json
import uuid
from pathlib import Path

from app.config import settings
from app.llm import enrich_findings
from app.repository import from_github, from_zip
from app.scanner import LANGUAGE_RULES, analyze_repository
from app.schemas import Finding


def new_id() -> str:
    return uuid.uuid4().hex[:16]


def manifest_path(audit_id: str) -> Path:
    return settings.audits_dir / audit_id / "audit.json"


def save_manifest(
    audit_id: str,
    source: str,
    root: Path,
    findings: list[Finding],
    owner_id: int | None = None,
) -> None:
    manifest_path(audit_id).write_text(
        json.dumps(
            {
                "audit_id": audit_id,
                "source": source,
                "root": str(root),
                "owner_id": owner_id,
                "findings": [f.model_dump() for f in findings],
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def load_manifest(audit_id: str):
    path = manifest_path(audit_id)
    if not path.exists():
        raise FileNotFoundError("Audit not found.")
    return json.loads(path.read_text(encoding="utf-8"))


async def run_zip(path: str, owner_id: int | None = None):
    audit_id = new_id()
    root, source = from_zip(path, audit_id)
    findings = analyze_repository(root)
    findings = await enrich_findings(findings)
    save_manifest(audit_id, source, root, findings, owner_id)
    return audit_id, source, findings


async def run_github(url: str, owner_id: int | None = None):
    audit_id = new_id()
    root, source = await from_github(url, audit_id)
    findings = analyze_repository(root)
    findings = await enrich_findings(findings)
    save_manifest(audit_id, source, root, findings, owner_id)
    return audit_id, source, findings


def summary(findings):
    out = {"total": len(findings), "high": 0, "medium": 0, "low": 0}
    for finding in findings:
        if finding.risk in out:
            out[finding.risk] += 1
    return out


def apply_findings(audit_id: str, ids, approved: bool):
    if not approved:
        raise PermissionError("Explicit approval is required.")

    data = load_manifest(audit_id)
    root = Path(data["root"]).resolve()
    known = {finding["id"]: finding for finding in data["findings"]}
    requested = set(ids)

    if not requested or not requested.issubset(known):
        raise ValueError("Invalid finding IDs.")

    applied = []
    changed = set()
    marker_extensions = {".py", *LANGUAGE_RULES}
    for finding_id in requested:
        finding = known[finding_id]
        rel = Path(finding["file_path"])
        if (
            rel.is_absolute()
            or ".." in rel.parts
            or rel.suffix.lower() not in marker_extensions
        ):
            raise ValueError("Unsafe patch target.")

        target = (root / rel).resolve()
        if root not in target.parents or not target.is_file():
            raise ValueError("Invalid patch target.")

        original = target.read_text(encoding="utf-8")
        comment = "#" if rel.suffix.lower() in {".py", ".rb"} else "//"
        marker = f"{comment} Logging auditor review ({finding_id}): {finding['title']}"
        if marker not in original:
            lines = original.splitlines()
            lines.insert(max(0, min(len(lines), finding["line"] - 1)), marker)
            target.write_text(
                "\n".join(lines) + ("\n" if original.endswith("\n") else ""),
                encoding="utf-8",
            )

        finding["status"] = "approved_marker_applied"
        applied.append(finding_id)
        changed.add(rel.as_posix())

    data["findings"] = list(known.values())
    manifest_path(audit_id).write_text(
        json.dumps(data, indent=2),
        encoding="utf-8",
    )
    return applied, sorted(changed)

