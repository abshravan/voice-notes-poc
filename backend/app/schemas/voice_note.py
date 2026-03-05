from datetime import datetime
from pydantic import BaseModel

from app.schemas.memory import VoiceNoteStatus


class VoiceNoteUploadResponse(BaseModel):
    """Returned after a successful audio upload."""
    id: str
    filename: str
    audio_url: str
    file_size: int
    content_type: str
    status: VoiceNoteStatus
    created_at: datetime
