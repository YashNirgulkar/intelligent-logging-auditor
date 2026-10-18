
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.config import settings
from app.repository import GitHubFetchError, RepositoryError
from app.schemas import ApplyRequest, AuditResponse, Finding, GitHubAuditRequest
from app.security import UnsafeArchiveError
from app.service import (
    apply_findings,
    load_manifest,
    run_github,
    run_zip,
    summary,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.audits_dir.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="Intelligent Logging Auditor",
    version="0.1.0",
    lifespan=lifespan,
)
if settings.cors_origin_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Accept", "Content-Type", "Authorization"],
    )


@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <h1>Intelligent Logging Auditor</h1>
    <p>Audit Python, JavaScript/TypeScript, Java, Go, C#, PHP, Ruby, and Rust code for potential missing logging.</p>
    <p><a href="/docs">Open API docs</a></p>
    <p>Submitted code is analyzed, never executed.
    Review every heuristic finding.</p>
    """


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post(
    "/api/v1/audits/upload",
    response_model=AuditResponse,
)
async def upload(file: UploadFile = File(...)):  # noqa: B008
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Upload a .zip file.",
        )

    max_bytes = settings.max_upload_mb * 1024 * 1024
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".zip",
            delete=False,
        ) as tmp:
            temp_path = Path(tmp.name)
            size = 0

            while chunk := await file.read(1024 * 1024):
                size += len(chunk)

                if size > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail="Upload exceeds size limit.",
                    )

                tmp.write(chunk)

        audit_id, source, findings = await run_zip(temp_path)

        return AuditResponse(
            audit_id=audit_id,
            source=source,
            findings=findings,
            summary=summary(findings),
        )

    except HTTPException:
        raise

    except (UnsafeArchiveError, RepositoryError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Audit failed; inspect server logs.",
        ) from exc

    finally:
        if temp_path:
            temp_path.unlink(missing_ok=True)

        await file.close()


@app.post(
    "/api/v1/audits/github",
    response_model=AuditResponse,
)
async def github(request: GitHubAuditRequest):
    try:
        audit_id, source, findings = await run_github(
            str(request.repo_url)
        )

        return AuditResponse(
            audit_id=audit_id,
            source=source,
            findings=findings,
            summary=summary(findings),
        )

    except (RepositoryError, UnsafeArchiveError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except GitHubFetchError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="GitHub audit failed; verify URL/access.",
        ) from exc


@app.get(
    "/api/v1/audits/{audit_id}",
    response_model=AuditResponse,
)
async def get_audit(audit_id: str):
    try:
        data = load_manifest(audit_id)

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    findings = [
        Finding(**finding)
        for finding in data["findings"]
    ]

    return AuditResponse(
        audit_id=audit_id,
        source=data["source"],
        findings=findings,
        summary=summary(findings),
    )


@app.get("/api/v1/audits/{audit_id}/patches")
async def patches(audit_id: str):
    try:
        data = load_manifest(audit_id)

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return {
        "audit_id": audit_id,
        "approval_required": True,
        "patches": [
            {
                "finding_id": finding["id"],
                "file_path": finding["file_path"],
                "line": finding["line"],
                "title": finding["title"],
                "suggested_code": finding["suggested_code"],
                "status": finding["status"],
            }
            for finding in data["findings"]
        ],
    }


@app.post("/api/v1/audits/{audit_id}/apply")
async def apply(audit_id: str, request: ApplyRequest):
    try:
        applied, changed = apply_findings(
            audit_id,
            request.finding_ids,
            request.approved,
        )

        return {
            "audit_id": audit_id,
            "applied_finding_ids": applied,
            "changed_files": changed,
            "message": (
                "Review markers applied to workspace. "
                "Inspect diff and run tests before merging."
            ),
        }

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except PermissionError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

