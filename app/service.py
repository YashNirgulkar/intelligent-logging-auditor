import json, uuid
from pathlib import Path
from app.config import settings
from app.repository import from_zip, from_github
from app.scanner import analyze_repository
from app.llm import enrich_findings
from app.schemas import Finding

def new_id(): return uuid.uuid4().hex[:16]
def manifest_path(audit_id): return settings.audits_dir/audit_id/"audit.json"
def save_manifest(audit_id, source, root, findings):
    manifest_path(audit_id).write_text(json.dumps({"audit_id":audit_id,"source":source,"root":str(root),"findings":[f.model_dump() for f in findings]},indent=2),encoding="utf-8")
def load_manifest(audit_id):
    path=manifest_path(audit_id)
    if not path.exists(): raise FileNotFoundError("Audit not found.")
    return json.loads(path.read_text(encoding="utf-8"))
async def run_zip(path):
    audit_id=new_id(); root,source=from_zip(path,audit_id)
    findings=analyze_repository(root); findings=await enrich_findings(findings); save_manifest(audit_id,source,root,findings)
    return audit_id,source,findings
async def run_github(url):
    audit_id=new_id(); root,source=await from_github(url,audit_id)
    findings=analyze_repository(root); findings=await enrich_findings(findings); save_manifest(audit_id,source,root,findings)
    return audit_id,source,findings
def summary(findings):
    out={"total":len(findings),"high":0,"medium":0,"low":0}
    for f in findings:
        if f.risk in out: out[f.risk]+=1
    return out
def apply_findings(audit_id, ids, approved):
    if not approved: raise PermissionError("Explicit approval is required.")
    data=load_manifest(audit_id); root=Path(data["root"]).resolve()
    known={f["id"]:f for f in data["findings"]}; requested=set(ids)
    if not requested or not requested.issubset(known): raise ValueError("Invalid finding IDs.")
    applied=[]; changed=set()
    for fid in requested:
        finding=known[fid]; rel=Path(finding["file_path"])
        if rel.is_absolute() or ".." in rel.parts or rel.suffix!=".py": raise ValueError("Unsafe patch target.")
        target=(root/rel).resolve()
        if root not in target.parents or not target.is_file(): raise ValueError("Invalid patch target.")
        original=target.read_text(encoding="utf-8")
        marker=f"# Logging auditor review ({fid}): {finding['title']}"
        if marker not in original:
            lines=original.splitlines(); lines.insert(max(0,min(len(lines),finding["line"]-1)),marker)
            target.write_text("\n".join(lines)+("\n" if original.endswith("\n") else ""),encoding="utf-8")
        finding["status"]="approved_marker_applied"; applied.append(fid); changed.add(rel.as_posix())
    data["findings"]=list(known.values())
    manifest_path(audit_id).write_text(json.dumps(data,indent=2),encoding="utf-8")
    return applied,sorted(changed)
