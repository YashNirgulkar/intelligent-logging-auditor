from pydantic import BaseModel, Field, HttpUrl, field_validator


class AuthCredentials(BaseModel):
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    password: str = Field(min_length=12, max_length=128)


class RegisterRequest(AuthCredentials):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    position: str = Field(min_length=2, max_length=80)

    @field_validator("first_name", "last_name", "position")
    @classmethod
    def trim_profile_fields(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    position: str
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
