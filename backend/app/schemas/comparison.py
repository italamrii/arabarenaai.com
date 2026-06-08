from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.common import CategoryResolved, ModelOut, ProviderRef


class ComparisonCreateRequest(BaseModel):
    prompt: str = Field(default="", max_length=4000)
    category_mode: str = Field(..., pattern="^(manual|auto)$")
    category_key: str | None = None
    model_ids: list[str] = Field(..., min_length=2, max_length=10)
    attachment_id: str | None = None

    @field_validator("model_ids")
    @classmethod
    def unique_models(cls, value: list[str]) -> list[str]:
        if len(value) != len(set(value)):
            raise ValueError("model_ids must be unique")
        return value

    @model_validator(mode="after")
    def prompt_or_attachment(self) -> "ComparisonCreateRequest":
        if not self.prompt.strip() and not self.attachment_id:
            raise ValueError("prompt or attachment_id is required")
        return self


class AttachmentRef(BaseModel):
    id: str
    url: str | None = None
    mime_type: str | None = None
    size: int | None = None
    filename: str | None = None


class PromptRef(BaseModel):
    id: str
    content: str | None = None
    char_count: int | None = None
    attachment: AttachmentRef | None = None


class TargetRef(BaseModel):
    model_id: str
    position: int


class ResponseOut(BaseModel):
    id: str
    model: ModelOut | None = None
    content: str | None = None
    response_time_ms: int | None = None
    status: str
    error_message_ar: str | None = None
    # Temporary debug fields (from content_structured); not exposed on success paths.
    error_code: str | None = None
    error_message_debug: str | None = None
    provider_key: str | None = None
    model_key: str | None = None
    exception_class: str | None = None
    status_code: int | None = None
    request_id: str | None = None


class VoteRef(BaseModel):
    response_id: str
    created_at: str


class ComparisonOut(BaseModel):
    id: str
    status: str
    prompt: PromptRef
    category: CategoryResolved
    targets: list[TargetRef] = Field(default_factory=list)
    responses: list[ResponseOut] = Field(default_factory=list)
    vote: VoteRef | None = None
    created_at: str
    completed_at: str | None = None


class ComparisonCreatedOut(BaseModel):
    id: str
    status: str
    prompt: PromptRef
    category: CategoryResolved
    targets: list[TargetRef]
    created_at: str
