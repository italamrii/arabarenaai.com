from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.platform_setting import PlatformSetting

MAINTENANCE_KEY = "maintenance_mode"
DEFAULT_MAINTENANCE_ID = uuid.UUID("00000000-0000-4000-8000-000000000001")

DEFAULT_MAINTENANCE_VALUE: dict[str, Any] = {
    "enabled": False,
    "message_ar": "نقوم حالياً بأعمال صيانة وتحسينات على المنصة. سنعود قريباً.",
    "message_en": "We are performing maintenance and improvements. We will be back soon.",
    "estimated_return": "قريباً",
}


class PlatformSettingsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _get_row(self, key: str) -> PlatformSetting | None:
        return self.db.scalar(select(PlatformSetting).where(PlatformSetting.key == key))

    def get_maintenance_mode(self) -> dict[str, Any]:
        row = self._get_row(MAINTENANCE_KEY)
        if row is None:
            return dict(DEFAULT_MAINTENANCE_VALUE)
        merged = dict(DEFAULT_MAINTENANCE_VALUE)
        if isinstance(row.value, dict):
            merged.update(row.value)
        return merged

    def set_maintenance_mode(self, payload: dict[str, Any]) -> dict[str, Any]:
        row = self._get_row(MAINTENANCE_KEY)
        if row is None:
            row = PlatformSetting(
                id=DEFAULT_MAINTENANCE_ID,
                key=MAINTENANCE_KEY,
                value=dict(DEFAULT_MAINTENANCE_VALUE),
            )
            self.db.add(row)

        current = dict(DEFAULT_MAINTENANCE_VALUE)
        if isinstance(row.value, dict):
            current.update(row.value)
        current.update(payload)
        row.value = current
        self.db.commit()
        self.db.refresh(row)
        return current

    def is_maintenance_enabled(self) -> bool:
        return bool(self.get_maintenance_mode().get("enabled"))
