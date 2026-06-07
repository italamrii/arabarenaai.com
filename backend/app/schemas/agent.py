from pydantic import BaseModel


class AgentListData(BaseModel):
    agents: list[dict] = []
