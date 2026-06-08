from pydantic import BaseModel, Field


class MaintenanceModeData(BaseModel):
    enabled: bool = False
    message_ar: str = "نقوم حالياً بأعمال صيانة وتحسينات على المنصة. سنعود قريباً."
    message_en: str = "We are performing maintenance and improvements. We will be back soon."
    estimated_return: str = "قريباً"


class PlatformStatusData(BaseModel):
    maintenance: MaintenanceModeData


class MaintenanceModeUpdate(BaseModel):
    enabled: bool
    message_ar: str | None = None
    message_en: str | None = None
    estimated_return: str | None = None
