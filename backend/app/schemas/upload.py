from pydantic import BaseModel


class UploadOut(BaseModel):
    id: str
    url: str
    mime_type: str
    size: int
    filename: str
