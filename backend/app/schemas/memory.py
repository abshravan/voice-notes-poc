from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class MemoryType(str, Enum):
    idea = "idea"
    task = "task"
    note = "note"


class MemoryStatus(str, Enum):
    pending = "pending"
    processed = "processed"
    failed = "failed"


class VoiceNoteStatus(str, Enum):
    uploading = "uploading"
    transcribing = "transcribing"
    processing = "processing"
    done = "done"
    error = "error"


class MemoryCreate(BaseModel):
    type: MemoryType
    title: str
    content: str
    tags: list[str] = []
    transcript: str


class MemoryUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    type: MemoryType | None = None
    tags: list[str] | None = None


class MemoryResponse(BaseModel):
    id: str
    type: MemoryType
    title: str
    content: str
    tags: list[str]
    action_items: list[str]
    audio_url: str | None
    transcript: str
    created_at: datetime
    updated_at: datetime
    status: MemoryStatus

    model_config = {"from_attributes": True}


class VoiceNoteResponse(BaseModel):
    id: str
    audio_url: str
    duration_seconds: float
    transcript: str | None
    memory_id: str | None
    created_at: datetime
    status: VoiceNoteStatus

    model_config = {"from_attributes": True}


class SearchQuery(BaseModel):
    query: str
    limit: int = 10


class SearchResult(BaseModel):
    memory: MemoryResponse
    score: float
