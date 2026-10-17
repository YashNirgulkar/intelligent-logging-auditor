from pathlib import Path
import zipfile, pytest
from app.security import safe_extract_zip, UnsafeArchiveError, validate_relative_path

def test_zip_traversal_rejected(tmp_path):
    z=tmp_path/"bad.zip"
    with zipfile.ZipFile(z,"w") as f: f.writestr("../escape.txt","bad")
    with pytest.raises(UnsafeArchiveError): safe_extract_zip(z,tmp_path/"out")

def test_parent_path_rejected():
    with pytest.raises(ValueError): validate_relative_path("../secret")

def test_safe_zip(tmp_path):
    z=tmp_path/"ok.zip"
    with zipfile.ZipFile(z,"w") as f: f.writestr("repo/a.py","print('ok')")
    safe_extract_zip(z,tmp_path/"out")
    assert (tmp_path/"out/repo/a.py").read_text()=="print('ok')"
