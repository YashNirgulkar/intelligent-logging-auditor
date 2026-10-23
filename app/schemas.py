from pydantic import BaseModel, Field, HttpUrl


class AuthCredentials(BaseModel):
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    password: str = Field(min_length=12, max_length=128)


class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    created_at: float
    last_login_at: float | None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserAccessRequest(BaseModel):
    is_active: bool


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

