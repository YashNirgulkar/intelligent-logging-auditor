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

## Deploy to Render
The root `render.yaml` defines a public FastAPI service and a static frontend. To deploy, open Render's Blueprint creation page, connect this GitHub repository, and select the Blueprint. The frontend is configured to use the API service URL and the API allows the configured frontend origin.

The free backend configuration stores audit workspaces under `/tmp`; those files can disappear when the service restarts or redeploys. Use a paid persistent disk and set `APP_DATA_DIR` to its mount path if audit history and source workspaces must survive restarts. Optional GitHub and LLM tokens can be set in the backend service environment; do not commit them.

## API
- `POST /api/v1/audits/upload` multipart ZIP upload
- `POST /api/v1/audits/github` JSON `{"repo_url":"https://github.com/owner/repo"}`
- `GET /api/v1/audits/{audit_id}`
- `GET /api/v1/audits/{audit_id}/patches`
- `POST /api/v1/audits/{audit_id}/apply` JSON `{"finding_ids":["..."],"approved":true}`

## Important limitations
The analyzer uses Python AST analysis and conservative source heuristics for JavaScript/TypeScript, Java, Go, C#, PHP, Ruby, and Rust; it is not a complete control-flow proof. It detects common risky calls in functions without recognized logger calls. Python exception handlers that neither log nor re-raise are also flagged. The approval endpoint adds a review marker comment; it does not blindly inject executable code. Review the proposed snippet and implement the actual fix manually or extend the patch engine with AST-aware edits. Never log secrets, tokens, credentials, personal data, or entire request payloads.

Before public deployment add authentication, per-user isolation, rate limiting, cleanup/retention, HTTPS, audit trails, and network egress controls. Repository code is never executed and no changes are pushed to GitHub. GitHub archives are read-only source imports.
