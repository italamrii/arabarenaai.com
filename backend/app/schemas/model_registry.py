from pydantic import BaseModel, Field


class ModelRegistryProviderRef(BaseModel):
    id: str
    key: str
    name_ar: str
    name_en: str | None = None
    enabled: bool


class ModelRegistryItem(BaseModel):
    id: str
    key: str
    name_ar: str
    name_en: str | None = None
    provider_id: str
    provider_key: str
    provider_name_ar: str
    is_enabled: bool
    is_placeholder: bool
    is_archived: bool
    supports_attachments: bool
    sort_order: int
    max_tokens: int
    timeout_ms: int
    adapter_configured: bool


class ModelRegistryListData(BaseModel):
    models: list[ModelRegistryItem]
    providers: list[ModelRegistryProviderRef]


class ModelRegistryCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=64)
    name_ar: str = Field(..., min_length=1, max_length=128)
    name_en: str | None = Field(default=None, max_length=128)
    provider_key: str = Field(..., min_length=1, max_length=32)
    is_enabled: bool = True
    is_placeholder: bool = False
    supports_attachments: bool = False
    sort_order: int = 0
    max_tokens: int = Field(default=4096, ge=100, le=32000)
    timeout_ms: int = Field(default=30000, ge=5000, le=120000)


class ModelRegistryUpdate(BaseModel):
    key: str | None = Field(default=None, min_length=1, max_length=64)
    name_ar: str | None = Field(default=None, min_length=1, max_length=128)
    name_en: str | None = Field(default=None, max_length=128)
    provider_key: str | None = Field(default=None, min_length=1, max_length=32)
    is_enabled: bool | None = None
    is_placeholder: bool | None = None
    is_archived: bool | None = None
    supports_attachments: bool | None = None
    sort_order: int | None = None
    max_tokens: int | None = Field(default=None, ge=100, le=32000)
    timeout_ms: int | None = Field(default=None, ge=5000, le=120000)
    confirm_disable_all: bool = False


class ModelRegistryTestRequest(BaseModel):
    locale: str = Field(default="ar", pattern="^(ar|en)$")


class ModelRegistryTestResult(BaseModel):
    success: bool
    response_preview: str | None = None
    response_time_ms: int | None = None
    error_message: str | None = None
    error_message_en: str | None = None
