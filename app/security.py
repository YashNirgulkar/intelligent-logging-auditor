from pathlib import Path, PurePosixPath
import zipfile

class UnsafeArchiveError(ValueError):
    pass

def safe_extract_zip(zip_path: Path, destination: Path, max_files: int = 5000) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    root = destination.resolve()
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
                dst.write(src.read())

def validate_relative_path(value: str) -> Path:
    path = PurePosixPath(value)
    if path.is_absolute() or not path.parts or ".." in path.parts:
        raise ValueError("Unsafe relative path.")
    return Path(*path.parts)
