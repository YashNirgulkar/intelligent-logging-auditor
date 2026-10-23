
import logging
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPAuthorizationCredentials

from app.config import settings
from app.auth import (
    admin_user,
    bearer_auth,
    create_session,
    current_user,
    init_auth_store,
    list_users,
    register_user,
    revoke_session,
    set_user_access,
)
from app.repository import GitHubFetchError, RepositoryError
from app.schemas import (
    ApplyRequest,
    AuditResponse,
    AuthCredentials,
    AuthResponse,
    Finding,
    GitHubAuditRequest,
    RegisterRequest,
    UserAccessRequest,
    UserResponse,
)
from app.security import UnsafeArchiveError
from app.service import (
    apply_findings,
    load_manifest,
    run_github,
    run_zip,
    summary,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.audits_dir.mkdir(parents=True, exist_ok=True)
    init_auth_store()
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
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
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


def _ensure_audit_access(data: dict, user: dict) -> None:
    if data.get("owner_id") != user["id"] and user["role"] != "admin":
        # Use 404 so callers cannot probe whether another account's audit exists.
        raise HTTPException(status_code=404, detail="Audit not found.")


@app.post("/api/v1/auth/register", response_model=UserResponse, status_code=201)
def register(request: RegisterRequest):
    """Create a standard account. Administrator privileges are configured by the operator."""
    return register_user(
        request.first_name,
        request.last_name,
        request.email,
        request.password,
        request.position,
    )


@app.post("/api/v1/auth/login", response_model=AuthResponse)
def login(request: AuthCredentials):
    token, user = create_session(request.email, request.password)
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.get("/api/v1/auth/me", response_model=UserResponse)
def me(user: dict = Depends(current_user)):
    return user


@app.post("/api/v1/auth/logout", status_code=204)
def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_auth),
    _: dict = Depends(current_user),
):
    # The token itself is deliberately never persisted in plaintext.
    if isinstance(credentials, HTTPAuthorizationCredentials):
        revoke_session(credentials.credentials)
    return None


@app.get("/api/v1/admin/users", response_model=list[UserResponse])
def admin_list_users(_: dict = Depends(admin_user)):
    return list_users()


@app.patch("/api/v1/admin/users/{user_id}", response_model=UserResponse)
def admin_set_user_access(
    user_id: int,
    request: UserAccessRequest,
    _: dict = Depends(admin_user),
):
    return set_user_access(user_id, request.is_active)


@app.post(
    "/api/v1/audits/upload",
    response_model=AuditResponse,
)
async def upload(
    file: UploadFile = File(...),
    user: dict = Depends(current_user),
):  # noqa: B008
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Upload a .zip file.",
        )

    max_bytes = settings.max_upload_mb * 1024 * 1024
    temp_path = None
    logger.info("Starting ZIP repository audit")

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

        audit_id, source, findings = await run_zip(temp_path, user["id"])
        logger.info(
            "ZIP repository audit completed audit_id=%s upload_bytes=%d finding_count=%d",
            audit_id,
            size,
            len(findings),
        )

        return AuditResponse(
            audit_id=audit_id,
            source=source,
            findings=findings,
            summary=summary(findings),
        )

    except HTTPException as exc:
        logger.warning(
            "ZIP repository audit request rejected status_code=%d",
            exc.status_code,
        )
        raise

    except (UnsafeArchiveError, RepositoryError, ValueError) as exc:
        logger.warning(
            "ZIP repository audit failed validation error_type=%s",
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception(
            "ZIP repository audit failed",
            extra={"error_type": type(exc).__name__},
        )
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
async def github(request: GitHubAuditRequest, user: dict = Depends(current_user)):
    try:
        audit_id, source, findings = await run_github(
            str(request.repo_url), user["id"]
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
async def get_audit(audit_id: str, user: dict = Depends(current_user)):
    try:
        data = load_manifest(audit_id)

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    _ensure_audit_access(data, user)

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
async def patches(audit_id: str, user: dict = Depends(current_user)):
    try:
        data = load_manifest(audit_id)

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    _ensure_audit_access(data, user)

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
async def apply(
    audit_id: str,
    request: ApplyRequest,
    user: dict = Depends(current_user),
):
    try:
        data = load_manifest(audit_id)
        _ensure_audit_access(data, user)
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
