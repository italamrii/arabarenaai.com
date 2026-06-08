from pydantic import BaseModel, Field


class ProviderControlItem(BaseModel):
    key: str
    name_ar: str
    name_en: str | None = None
    enabled: bool


class ProviderControlsData(BaseModel):
    providers: list[ProviderControlItem]


class ProviderControlUpdate(BaseModel):
    provider_key: str = Field(..., min_length=1, max_length=32)
    enabled: bool


class ModelControlItem(BaseModel):
    id: str
    key: str
    name_ar: str
    name_en: str | None = None
    provider_key: str
    enabled: bool


class ModelControlsData(BaseModel):
    models: list[ModelControlItem]


class ModelControlUpdate(BaseModel):
    model_key: str = Field(..., min_length=1, max_length=64)
    enabled: bool
