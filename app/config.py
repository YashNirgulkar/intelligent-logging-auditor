from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_data_dir: Path = Path("./data")
    max_upload_mb: int = 20
    cors_origins: str = ""
    audit_username: str = ""
    audit_password: str = ""
    audit_token_secret: str = ""
    audit_token_ttl_seconds: int = 43200
    github_token: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_api_key: str = ""
    llm_model: str = "gpt-4.1-mini"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def audits_dir(self) -> Path:
        path = self.app_data_dir / "audits"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def auth_configured(self) -> bool:
        return bool(
            self.audit_username.strip()
            and self.audit_password
            and len(self.audit_token_secret) >= 32
        )


settings = Settings()

