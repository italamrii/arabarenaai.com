from functools import lru_cache

from pathlib import Path



from dotenv import load_dotenv

from pydantic import field_validator

from pydantic_settings import BaseSettings, SettingsConfigDict



# backend/app/core/config.py → backend/

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent





def _bootstrap_env() -> Path:

    """Load backend/.env regardless of process cwd. Returns path used."""

    candidates = [

        BACKEND_ROOT / ".env",

        Path.cwd() / ".env",

        Path.cwd() / "backend" / ".env",

    ]

    for path in candidates:

        if path.is_file():

            load_dotenv(path, override=False, encoding="utf-8")

            return path.resolve()

    return (BACKEND_ROOT / ".env").resolve()





ENV_FILE = _bootstrap_env()





class Settings(BaseSettings):

    model_config = SettingsConfigDict(

        env_file=ENV_FILE,

        env_file_encoding="utf-8",

        case_sensitive=False,

        extra="ignore",

    )



    database_url: str = "postgresql://postgres:postgres@localhost:5432/arab_benchmark"

    session_secret: str = "dev-secret-change-me"

    app_version: str = "1.0.0"

    cors_origins: str = "http://localhost:3000"



    category_classifier_model: str = "gpt-4o-mini"

    category_confidence_threshold: float = 0.6



    # Env: OPENAI_API_KEY → openai_api_key (case_sensitive=False)

    openai_api_key: str | None = None

    anthropic_api_key: str | None = None

    google_api_key: str | None = None

    deepseek_api_key: str | None = None

    qwen_api_key: str | None = None

    xai_api_key: str | None = None

    allam_api_key: str | None = None



    deepseek_base_url: str = "https://api.deepseek.com"

    qwen_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"

    xai_base_url: str = "https://api.x.ai/v1"



    max_prompt_length: int = 4000

    min_models: int = 2

    max_models: int = 10



    rate_limit_comparisons_per_hour: int = 10

    rate_limit_category_detect_per_hour: int = 20

    rate_limit_votes_per_hour: int = 30

    rate_limit_analytics_per_minute: int = 60



    log_level: str = "INFO"

    log_format: str = "json"



    @field_validator(

        "openai_api_key",

        "anthropic_api_key",

        "google_api_key",

        "deepseek_api_key",

        "qwen_api_key",

        "xai_api_key",

        "allam_api_key",

        mode="before",

    )

    @classmethod

    def empty_key_to_none(cls, value: str | None) -> str | None:

        if value is None:

            return None

        if isinstance(value, str) and not value.strip():

            return None

        return value.strip() if isinstance(value, str) else value



    @property

    def cors_origin_list(self) -> list[str]:

        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]



    @property

    def env_file_path(self) -> str:

        return str(ENV_FILE)



    @property

    def env_file_exists(self) -> bool:

        return ENV_FILE.is_file()



    @property

    def openai_api_key_configured(self) -> bool:

        return bool(self.openai_api_key)



    @property

    def provider_keys_configured(self) -> dict[str, bool]:

        return {

            "openai": bool(self.openai_api_key),

            "anthropic": bool(self.anthropic_api_key),

            "google": bool(self.google_api_key),

            "deepseek": bool(self.deepseek_api_key),

            "qwen": bool(self.qwen_api_key),

            "xai": bool(self.xai_api_key),

            "allam": bool(self.allam_api_key),

        }





@lru_cache

def get_settings() -> Settings:

    return Settings()





def reload_settings() -> Settings:

    """Clear cached settings after env bootstrap (startup / tests)."""

    get_settings.cache_clear()

    return get_settings()


