from datetime import datetime
from pydantic import BaseModel

from app.schemas.memory import VoiceNoteStatus


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


class VoiceNoteFullResponse(BaseModel):
    """Combined upload + transcription result for the unified endpoint."""
    id: str
    filename: str
    audio_url: str
    file_size: int
    content_type: str
    transcript: str | None
    language: str | None
    duration_seconds: float
    status: VoiceNoteStatus
    created_at: datetime
