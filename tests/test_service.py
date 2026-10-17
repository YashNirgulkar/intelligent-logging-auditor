import pytest
from app.schemas import Finding
import app.service as service

def test_apply_requires_approval(monkeypatch,tmp_path):
    monkeypatch.setattr(service.settings,"app_data_dir",tmp_path)
    aid="1234567890abcdef"; root=tmp_path/"audits"/aid/"source"; root.mkdir(parents=True)
    (root/"app.py").write_text("def f():\n    pass\n")
    f=Finding(id="abc123",file_path="app.py",line=2,function_name="f",risk="medium",rule="x",title="Missing logs",rationale="test",suggested_code="logger.info('x')")
    service.save_manifest(aid,"test",root,[f])
    with pytest.raises(PermissionError): service.apply_findings(aid,["abc123"],False)
