from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_data_dir: Path = Path("./data")
    max_upload_mb: int = 20
    cors_origins: str = ""
    admin_email: str = ""
    admin_password: str = ""
    auth_session_hours: int = 24
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
    def auth_db_path(self) -> Path:
        self.app_data_dir.mkdir(parents=True, exist_ok=True)
        return self.app_data_dir / "users.sqlite3"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

settings = Settings()

