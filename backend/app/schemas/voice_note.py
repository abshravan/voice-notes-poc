from datetime import datetime
from pydantic import BaseModel

from app.schemas.memory import MemoryType, VoiceNoteStatus


class VoiceNoteUploadResponse(BaseModel):
    """Returned after a successful audio upload (before transcription)."""
    id: str
    filename: str
    audio_url: str
    file_size: int
    content_type: str
    status: VoiceNoteStatus
    created_at: datetime


class TranscriptionResponse(BaseModel):
    """Returned after transcription completes."""
    voice_note_id: str
    transcript: str
    language: str
    duration_seconds: float


class StructuredMemory(BaseModel):
    """The LLM-extracted structure from a transcript."""
    type: MemoryType
    title: str
    content: str
    tags: list[str]
    action_items: list[str]


class StructureRequest(BaseModel):
    """Request body for standalone structuring endpoint."""
    transcript: str


class StructureResponse(BaseModel):
    """Response from standalone structuring endpoint."""
    memory: StructuredMemory


class VoiceNoteFullResponse(BaseModel):
    """Combined upload + transcription + structuring result."""
    id: str
    filename: str
    audio_url: str
    file_size: int
    content_type: str
    transcript: str | None
    language: str | None
    duration_seconds: float
    memory: StructuredMemory | None
    status: VoiceNoteStatus
    created_at: datetime
