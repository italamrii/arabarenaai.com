from fastapi import APIRouter

from app.core.dependencies import RequestId
from app.schemas.agent import AgentListData
from app.schemas.common import Envelope, to_meta

router = APIRouter()


@router.get("")
def list_agents(request_id: RequestId) -> Envelope[AgentListData]:
    return Envelope(
        data=AgentListData(agents=[]),
        meta=to_meta(request_id, coming_soon_ar="دعم الوكلاء الذكيين قريباً"),
    )
