from pathlib import Path
import re
import shutil
from urllib.parse import urlparse

import httpx

from app.config import settings
from app.security import safe_extract_zip


class RepositoryError(ValueError):
    pass


class GitHubFetchError(RuntimeError):
    pass


def create_workspace(audit_id: str) -> Path:
    path = settings.audits_dir / audit_id
    path.mkdir(parents=True, exist_ok=False)
    return path


def from_zip(upload_path: Path, audit_id: str):
    workspace = create_workspace(audit_id)
    extracted = workspace / "source"
    try:
        safe_extract_zip(upload_path, extracted)
        children = list(extracted.iterdir())
        root = children[0] if len(children) == 1 and children[0].is_dir() else extracted
        return root, "uploaded_zip"
    except Exception:
        shutil.rmtree(workspace, ignore_errors=True)
        raise


async def from_github(repo_url: str, audit_id: str):
    parsed = urlparse(repo_url)
    parts = [part for part in parsed.path.strip("/").split("/") if part]
    if (
        parsed.scheme != "https"
        or parsed.hostname != "github.com"
        or len(parts) != 2
        or parsed.query
        or parsed.fragment
        or parsed.username
        or parsed.password
    ):
        raise RepositoryError("Use https://github.com/owner/repo")

    owner, repo = parts[0], parts[1].removesuffix(".git")

    def valid_name(value: str) -> bool:
        return bool(re.fullmatch(r"[A-Za-z0-9_.-]+", value)) and value not in {".", ".."}

    if not valid_name(owner) or not valid_name(repo):
        raise RepositoryError("Invalid GitHub owner or repository name.")

    workspace = create_workspace(audit_id)
    archive = workspace / "repo.zip"
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "logging-auditor"}
    if settings.github_token:
        headers["Authorization"] = "Bearer " + settings.github_token

    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            async with client.stream(
                "GET",
                f"https://api.github.com/repos/{owner}/{repo}/zipball",
                headers=headers,
            ) as response:
                if response.status_code == 404:
                    raise RepositoryError(
                        "GitHub repository not found. Check the owner and repository name, and make sure it is public."
                    )
                if response.status_code in (403, 429):
                    raise GitHubFetchError(
                        "GitHub rate-limited this request. Wait a few minutes or configure a GitHub token in the backend environment."
                    )
                if response.is_error:
                    raise GitHubFetchError(
                        f"GitHub returned HTTP {response.status_code} while fetching the repository archive."
                    )

                total = 0
                with archive.open("wb") as out:
                    async for chunk in response.aiter_bytes():
                        total += len(chunk)
                        if total > settings.max_upload_mb * 1024 * 1024:
                            raise RepositoryError("Repository archive exceeds size limit.")
                        out.write(chunk)

        extracted = workspace / "source"
        safe_extract_zip(archive, extracted)
        children = list(extracted.iterdir())
        root = children[0] if len(children) == 1 and children[0].is_dir() else extracted
        archive.unlink(missing_ok=True)
        return root, f"https://github.com/{owner}/{repo}"
    except (RepositoryError, GitHubFetchError):
        shutil.rmtree(workspace, ignore_errors=True)
        raise
    except httpx.TimeoutException as exc:
        shutil.rmtree(workspace, ignore_errors=True)
        raise GitHubFetchError(
            "Timed out while downloading the GitHub repository. Try again or choose a smaller repository."
        ) from exc
    except httpx.RequestError as exc:
        shutil.rmtree(workspace, ignore_errors=True)
        raise GitHubFetchError(
            "Could not connect to GitHub. Check the backend's internet connection and try again."
        ) from exc
    except Exception:
        shutil.rmtree(workspace, ignore_errors=True)
        raise
