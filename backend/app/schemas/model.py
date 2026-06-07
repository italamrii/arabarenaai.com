from pydantic import BaseModel

from app.schemas.common import ModelOut


class ModelListData(BaseModel):
    models: list[ModelOut]
