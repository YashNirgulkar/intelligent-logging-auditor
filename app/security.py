import logging
import zipfile
from pathlib import Path, PurePosixPath

logger = logging.getLogger(__name__)


class UnsafeArchiveError(ValueError):
    pass


def safe_extract_zip(zip_path: Path, destination: Path, max_files: int = 5000) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    root = destination.resolve()
    extracted_files = 0
    extracted_bytes = 0
    try:
        with zipfile.ZipFile(zip_path) as archive:
            members = archive.infolist()
            if len(members) > max_files:
                raise UnsafeArchiveError("Archive has too many entries.")

            for member in members:
                name = member.filename
                posix = PurePosixPath(name)
                if posix.is_absolute() or ".." in posix.parts:
                    raise UnsafeArchiveError("Archive contains unsafe path.")

                mode = (member.external_attr >> 16) & 0o170000
                if mode not in (0, 0o100000, 0o040000):
                    raise UnsafeArchiveError("Archive contains a special file.")

                target = (root / Path(*posix.parts)).resolve()
                if target != root and root not in target.parents:
                    raise UnsafeArchiveError("Archive path escapes destination.")

            for member in members:
                if member.is_dir():
                    continue
                target = (root / Path(*PurePosixPath(member.filename).parts)).resolve()
                target.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(member) as src, target.open("wb") as dst:
                    contents = src.read()
                    dst.write(contents)
                    extracted_files += 1
                    extracted_bytes += len(contents)
    except Exception as exc:
        logger.warning(
            "ZIP archive extraction failed error_type=%s",
            type(exc).__name__,
        )
        raise

    logger.info(
        "ZIP archive extraction completed file_count=%d extracted_bytes=%d",
        extracted_files,
        extracted_bytes,
    )


def validate_relative_path(value: str) -> Path:
    path = PurePosixPath(value)
    if path.is_absolute() or not path.parts or ".." in path.parts:
        raise ValueError("Unsafe relative path.")
    return Path(*path.parts)

