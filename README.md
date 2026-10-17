# Intelligent Logging Auditor

Production-oriented starter for auditing Python repositories for potential missing logging. It analyzes code without executing it, produces findings and suggested snippets, and requires explicit approval before applying a review marker to the stored workspace.

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

## API
- `POST /api/v1/audits/upload` multipart ZIP upload
- `POST /api/v1/audits/github` JSON `{"repo_url":"https://github.com/owner/repo"}`
- `GET /api/v1/audits/{audit_id}`
- `GET /api/v1/audits/{audit_id}/patches`
- `POST /api/v1/audits/{audit_id}/apply` JSON `{"finding_ids":["..."],"approved":true}`

## Important limitations
The first version uses conservative AST heuristics, not a complete control-flow proof. It detects risky calls in functions without recognized logger calls and exception handlers that neither log nor re-raise. The approval endpoint adds a review marker comment; it does not blindly inject executable code. Review the proposed snippet and implement the actual fix manually or extend the patch engine with AST-aware edits. Never log secrets, tokens, credentials, personal data, or entire request payloads.

Before public deployment add authentication, per-user isolation, rate limiting, cleanup/retention, HTTPS, audit trails, and network egress controls. Repository code is never executed and no changes are pushed to GitHub. GitHub archives are read-only source imports.
