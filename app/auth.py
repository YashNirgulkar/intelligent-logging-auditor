"""Single-admin authentication for the hosted auditor."""

import base64
import hashlib
import hmac
import json
import time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

bearer_scheme = HTTPBearer(auto_error=False)


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sign in to use the audit workspace.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _configured() -> None:
    if not settings.auth_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured. Set AUDIT_USERNAME, AUDIT_PASSWORD, and AUDIT_TOKEN_SECRET.",
        )


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def authenticate(username: str, password: str) -> str:
    _configured()
    username_ok = hmac.compare_digest(username.encode(), settings.audit_username.encode())
    password_ok = hmac.compare_digest(password.encode(), settings.audit_password.encode())
    if not (username_ok and password_ok):
        raise _unauthorized()

    expires_at = int(time.time()) + settings.audit_token_ttl_seconds
    payload = _b64encode(
        json.dumps({"sub": settings.audit_username, "exp": expires_at}, separators=(",", ":")).encode()
    )
    signature = hmac.new(
        settings.audit_token_secret.encode(), payload.encode(), hashlib.sha256
    ).digest()
    return f"{payload}.{_b64encode(signature)}"


def verify_access_token(token: str | None) -> str:
    _configured()
    if not token:
        raise _unauthorized()
    try:
        payload_part, signature_part = token.split(".", 1)
        expected = hmac.new(
            settings.audit_token_secret.encode(), payload_part.encode(), hashlib.sha256
        ).digest()
        supplied = _b64decode(signature_part)
        if not hmac.compare_digest(expected, supplied):
            raise _unauthorized()
        payload = json.loads(_b64decode(payload_part))
        username = payload["sub"]
        if (
            not isinstance(username, str)
            or not hmac.compare_digest(username.encode(), settings.audit_username.encode())
            or not isinstance(payload["exp"], int)
            or payload["exp"] <= int(time.time())
        ):
            raise _unauthorized()
        return username
    except HTTPException:
        raise
    except (ValueError, KeyError, TypeError, json.JSONDecodeError, UnicodeDecodeError):
        raise _unauthorized() from None


def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return verify_access_token(None)
    return verify_access_token(credentials.credentials)

