from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class Meta(BaseModel):
    request_id: str | None = None
    sort: str | None = None
    generated_at: str | None = None
    min_selection: int | None = None
    max_selection: int | None = None
    default_key: str | None = None
    supports_auto_detect: bool | None = None
    coming_soon_ar: str | None = None


class Envelope(BaseModel, Generic[T]):
    data: T
    meta: Meta = Field(default_factory=Meta)


class ErrorDetail(BaseModel):
    field: str | None = None
    issue: str | None = None
    min: int | None = None


class ErrorBody(BaseModel):
    code: str
    message: str
    message_en: str
    details: list[ErrorDetail] = Field(default_factory=list)


class ErrorEnvelope(BaseModel):
    error: ErrorBody
    meta: Meta = Field(default_factory=Meta)


class ProviderRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    name_ar: str


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    name_ar: str
    name_en: str
    sort_order: int


class CategoryResolved(BaseModel):
    id: str
    key: str
    name_ar: str
    name_en: str
    source: str
    confidence: float | None = None


class ModelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    name_ar: str
    name_en: str | None = None
    provider: ProviderRef
    is_placeholder: bool = False
    max_tokens: int = 4096
    status_ar: str | None = None


def to_meta(request_id: str | None = None, **kwargs: Any) -> Meta:
    return Meta(request_id=request_id, **kwargs)
