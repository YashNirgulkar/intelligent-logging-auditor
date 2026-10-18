import logging
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

import httpx

from app.config import settings
from app.security import safe_extract_zip

logger = logging.getLogger(__name__)


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
    logger.info(
        "Starting GitHub repository archive download audit_id=%s repository=%s/%s",
        audit_id,
        owner,
        repo,
    )
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "logging-auditor"}
    if settings.github_token:
        headers["Authorization"] = "Bearer " + settings.github_token

    try:
        async with (
            httpx.AsyncClient(timeout=60, follow_redirects=True) as client,
            client.stream(
                "GET",
                f"https://api.github.com/repos/{owner}/{repo}/zipball",
                headers=headers,
            ) as response,
        ):
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
        logger.info(
            "GitHub repository archive downloaded and extracted audit_id=%s repository=%s/%s archive_bytes=%d",
            audit_id,
            owner,
            repo,
            total,
        )
        return root, f"https://github.com/{owner}/{repo}"
    except (RepositoryError, GitHubFetchError) as exc:
        logger.warning(
            "GitHub repository fetch failed audit_id=%s repository=%s/%s error_type=%s",
            audit_id,
            owner,
            repo,
            type(exc).__name__,
        )
        shutil.rmtree(workspace, ignore_errors=True)
        raise
    except httpx.TimeoutException as exc:
        logger.warning(
            "GitHub repository download timed out audit_id=%s repository=%s/%s",
            audit_id,
            owner,
            repo,
        )
        shutil.rmtree(workspace, ignore_errors=True)
        raise GitHubFetchError(
            "Timed out while downloading the GitHub repository. Try again or choose a smaller repository."
        ) from exc
    except httpx.RequestError as exc:
        logger.warning(
            "Could not connect to GitHub for repository download audit_id=%s repository=%s/%s error_type=%s",
            audit_id,
            owner,
            repo,
            type(exc).__name__,
        )
        shutil.rmtree(workspace, ignore_errors=True)
        raise GitHubFetchError(
            "Could not connect to GitHub. Check the backend's internet connection and try again."
        ) from exc
    except Exception as exc:
        logger.exception(
            "Unexpected GitHub repository download failure audit_id=%s repository=%s/%s error_type=%s",
            audit_id,
            owner,
            repo,
            type(exc).__name__,
        )
        shutil.rmtree(workspace, ignore_errors=True)
        raise

