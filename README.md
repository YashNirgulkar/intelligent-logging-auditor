# Intelligent Logging Auditor

Production-oriented starter for auditing repositories for potential missing logging. It analyzes Python with the standard-library AST and uses source heuristics for JavaScript/TypeScript, Java, Go, C#, PHP, Ruby, and Rust. It does not execute repository code, produces findings and suggested snippets, and requires explicit approval before applying a review marker to the stored workspace.

## Setup
Windows PowerShell:
```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
Copy-Item .env.example .env
uvicorn app.main:app --reload
```
Linux/macOS:
```bash
python3.11 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload
```
Docs: http://127.0.0.1:8000/docs

Users must create an account and sign in before using audit screens or protected API endpoints. Registration collects first name, last name, email, position (student, working professional, educator, researcher, freelancer, business owner, or other), and password. Profile details are stored in the backend account database and visible on the administrator's User access page. Public registration creates standard user accounts only; administrator access is provisioned from the backend's `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables. Passwords are hashed and are never shown in the admin list.

## Deploy to Render
The root `render.yaml` defines a FastAPI service and a static frontend. To deploy, open Render's Blueprint creation page, connect this GitHub repository, and select the Blueprint. The frontend is configured to use the API service URL and the API allows the configured frontend origin. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the API service environment before first use. Public registration is enabled, but only the configured administrator can open the user management dashboard.

The free backend configuration stores user accounts and audit workspaces under `/tmp`; these files can disappear when the service restarts or redeploys. Use a persistent disk and set `APP_DATA_DIR` to its mount path if accounts and audit workspaces must survive restarts. The administrator password is a Render secret and must not be committed. Optional GitHub and LLM tokens can be set in the backend service environment; do not commit them.

## API
Sign in at `POST /api/v1/auth/login` to receive a bearer token. Send it as `Authorization: Bearer <token>` on protected routes. The admin-only routes are `GET /api/v1/admin/users` and `PATCH /api/v1/admin/users/{user_id}`.

- `POST /api/v1/auth/register` — create a standard account with `first_name`, `last_name`, `email`, `position`, and `password`
- `POST /api/v1/auth/login` — start a session
- `GET /api/v1/auth/me` — get the signed-in account
- `POST /api/v1/auth/logout` — revoke the current session
- `GET /api/v1/admin/users` — list accounts (administrator only)
- `PATCH /api/v1/admin/users/{user_id}` — enable or disable access (administrator only)
- `POST /api/v1/audits/upload` multipart ZIP upload
- `POST /api/v1/audits/github` JSON `{"repo_url":"https://github.com/owner/repo"}`
- `GET /api/v1/audits/{audit_id}`
- `GET /api/v1/audits/{audit_id}/patches`
- `POST /api/v1/audits/{audit_id}/apply` JSON `{"finding_ids":["..."],"approved":true}`

## Important limitations
The analyzer uses Python AST analysis and conservative source heuristics for JavaScript/TypeScript, Java, Go, C#, PHP, Ruby, and Rust; it is not a complete control-flow proof. It detects common risky calls in functions without recognized logger calls. Python exception handlers that neither log nor re-raise are also flagged. The approval endpoint adds a review marker comment; it does not blindly inject executable code. Review the proposed snippet and implement the actual fix manually or extend the patch engine with AST-aware edits. Never log secrets, tokens, credentials, personal data, or entire request payloads.

Account passwords are hashed and bearer sessions expire. The app does not verify email ownership or provide password recovery; do not use it as a production identity provider without adding those controls, rate limiting, and an account recovery process. Never upload private code or secrets unless your deployment's data-retention and access controls are configured appropriately. Repository code is never executed and no changes are pushed to GitHub. GitHub archives are read-only source imports.

