from pydantic import BaseModel, Field, HttpUrl


class GitHubAuditRequest(BaseModel):
    repo_url: HttpUrl

class ApplyRequest(BaseModel):
    finding_ids: list[str] = Field(min_length=1)
    approved: bool = False
class Finding(BaseModel):
    id: str
    file_path: str
    line: int
    function_name: str
    risk: str
    rule: str
    title: str
    rationale: str
    suggested_code: str
    status: str = "suggested"
class AuditResponse(BaseModel):
    audit_id: str
    source: str
    findings: list[Finding]
    summary: dict[str, int]

