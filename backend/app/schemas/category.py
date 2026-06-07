from pydantic import BaseModel, Field

from app.schemas.common import CategoryOut, CategoryResolved


class CategoryListData(BaseModel):
    categories: list[CategoryOut]


class CategoryDetectRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)


class CategoryDetectData(BaseModel):
    suggested_category: CategoryOut
    confidence: float
    fallback_used: bool
