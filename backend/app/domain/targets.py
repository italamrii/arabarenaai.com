from dataclasses import dataclass
from enum import Enum
from uuid import UUID


class TargetType(str, Enum):
    MODEL = "model"
    AGENT = "agent"


@dataclass(frozen=True)
class InferenceTarget:
    type: TargetType
    ref_id: UUID
