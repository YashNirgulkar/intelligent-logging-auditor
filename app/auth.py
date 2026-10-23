"""Small SQLite-backed account and session store for the public demo app."""

from __future__ import annotations

import hashlib
import hmac
import secrets
import sqlite3
import time
from pathlib import Path
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

_ITERATIONS = 310_000
bearer_auth = HTTPBearer(auto_error=False)


def _connect() -> sqlite3.Connection:
    path: Path = settings.auth_db_path
    connection = sqlite3.connect(path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return f"pbkdf2_sha256${_ITERATIONS}${salt.hex()}${digest.hex()}"


def _verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt_hex, expected = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations)
        ).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def _public_user(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "email": row["email"],
        "position": row["position"],
        "role": row["role"],
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
        "last_login_at": row["last_login_at"],
    }


def init_auth_store() -> None:
    """Create account tables and provision the configured administrator."""
    with _connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL DEFAULT '',
                last_name TEXT NOT NULL DEFAULT '',
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                position TEXT NOT NULL DEFAULT 'Other',
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at REAL NOT NULL,
                last_login_at REAL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at REAL NOT NULL,
                created_at REAL NOT NULL
            );
            CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
            """
        )
        # Upgrade databases created before profile fields were added.
        columns = {row["name"] for row in db.execute("PRAGMA table_info(users)")}
        for name, declaration in (
            ("first_name", "TEXT NOT NULL DEFAULT ''"),
            ("last_name", "TEXT NOT NULL DEFAULT ''"),
            ("position", "TEXT NOT NULL DEFAULT 'Other'"),
        ):
            if name not in columns:
                db.execute(f"ALTER TABLE users ADD COLUMN {name} {declaration}")
        email = settings.admin_email.strip().lower()
        if bool(email) != bool(settings.admin_password):
            raise RuntimeError("Configure both ADMIN_EMAIL and ADMIN_PASSWORD, or leave both empty.")
        if settings.admin_password and len(settings.admin_password) < 12:
            raise RuntimeError("ADMIN_PASSWORD must contain at least 12 characters.")
        if email and settings.admin_password:
            db.execute(
                """INSERT INTO users (email, password_hash, role, created_at)
                   VALUES (?, ?, 'admin', ?)
                   ON CONFLICT(email) DO UPDATE SET
                       password_hash = excluded.password_hash,
                       role = 'admin', is_active = 1""",
                (email, _hash_password(settings.admin_password), time.time()),
            )


def register_user(
    first_name: str, last_name: str, email: str, password: str, position: str
) -> dict[str, Any]:
    normalized = email.strip().lower()
    try:
        with _connect() as db:
            cursor = db.execute(
                """INSERT INTO users
                   (first_name, last_name, email, position, password_hash, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    first_name.strip(),
                    last_name.strip(),
                    normalized,
                    position.strip(),
                    _hash_password(password),
                    time.time(),
                ),
            )
            row = db.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from exc
    return _public_user(row)


def create_session(email: str, password: str) -> tuple[str, dict[str, Any]]:
    normalized = email.strip().lower()
    with _connect() as db:
        db.execute("DELETE FROM sessions WHERE expires_at <= ?", (time.time(),))
        row = db.execute("SELECT * FROM users WHERE email = ?", (normalized,)).fetchone()
        if row is None or not _verify_password(password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Email or password is incorrect.")
        if not row["is_active"]:
            raise HTTPException(status_code=403, detail="This account is currently disabled.")
        token = secrets.token_urlsafe(32)
        now = time.time()
        db.execute(
            "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (
                hashlib.sha256(token.encode()).hexdigest(),
                row["id"],
                now + max(1, settings.auth_session_hours) * 3600,
                now,
            ),
        )
        db.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (now, row["id"]))
        refreshed = db.execute("SELECT * FROM users WHERE id = ?", (row["id"],)).fetchone()
    return token, _public_user(refreshed)


def get_user_for_token(token: str) -> dict[str, Any] | None:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with _connect() as db:
        row = db.execute(
            """SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
               WHERE sessions.token_hash = ? AND sessions.expires_at > ?""",
            (token_hash, time.time()),
        ).fetchone()
    if row is None or not row["is_active"]:
        return None
    return _public_user(row)


def revoke_session(token: str) -> None:
    with _connect() as db:
        db.execute("DELETE FROM sessions WHERE token_hash = ?", (hashlib.sha256(token.encode()).hexdigest(),))


def list_users() -> list[dict[str, Any]]:
    with _connect() as db:
        rows = db.execute("SELECT * FROM users ORDER BY created_at DESC, id DESC").fetchall()
    return [_public_user(row) for row in rows]


def set_user_access(user_id: int, is_active: bool) -> dict[str, Any]:
    with _connect() as db:
        row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="User not found.")
        if row["role"] == "admin" and not is_active:
            enabled_admins = db.execute(
                "SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = 1"
            ).fetchone()[0]
            if enabled_admins <= 1:
                raise HTTPException(status_code=400, detail="The last active administrator cannot be disabled.")
        db.execute("UPDATE users SET is_active = ? WHERE id = ?", (int(is_active), user_id))
        if not is_active:
            db.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        updated = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return _public_user(updated)


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_auth),
) -> dict[str, Any]:
    user = get_user_for_token(credentials.credentials) if credentials else None
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to use this application.", headers={"WWW-Authenticate": "Bearer"})
    return user


def admin_user(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Administrator access is required.")
    return user
