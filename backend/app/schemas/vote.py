from pydantic import BaseModel


class VoteCreateRequest(BaseModel):
    response_id: str


class VoteOut(BaseModel):
    id: str
    comparison_id: str
    response_id: str
    created_at: str


class VoteMeData(BaseModel):
    has_voted: bool
    vote: VoteOut | None = None
