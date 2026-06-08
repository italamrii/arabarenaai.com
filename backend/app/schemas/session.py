from pydantic import BaseModel


class SessionOut(BaseModel):
    session_id: str
    expires_at: str


class LegacySessionUpgradeRequest(BaseModel):
    legacy_session_id: str


class HealthData(BaseModel):
    status: str
    version: str


class ProviderHealthItem(BaseModel):
    key: str
    name_ar: str
    status: str
    latency_ms: int | None = None
    message_ar: str | None = None


class ProviderHealthData(BaseModel):
    providers: list[ProviderHealthItem]
    settings_openai_configured: bool
    registry_openai_configured: bool


class EnvDebugData(BaseModel):
    env_file_path: str
    env_file_exists: bool
    cwd: str
    openai_api_key_configured: bool
    provider_keys_configured: dict[str, bool]
    registry_openai_configured: bool
