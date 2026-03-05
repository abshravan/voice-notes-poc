import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.storage import (
    upload_audio,
    ALLOWED_AUDIO_TYPES,
    MAX_FILE_SIZE,
)
from app.schemas.voice_note import VoiceNoteUploadResponse
from app.schemas.memory import VoiceNoteStatus

router = APIRouter(prefix="/api/voice-notes", tags=["voice-notes"])


@router.post("/upload", response_model=VoiceNoteUploadResponse)
async def upload_voice_note(file: UploadFile = File(...)):
    """
    Upload an audio file for transcription and memory processing.

    Validates file type and size, stores in S3/MinIO, and returns metadata.
    The voice note starts in 'uploading' status and will progress through
    transcribing → processing → done in later phases.
    """
    # Validate content type
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {content_type}. "
                   f"Allowed: {', '.join(sorted(ALLOWED_AUDIO_TYPES))}",
        )

    # Read file bytes and validate size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {len(file_bytes)} bytes. Max: {MAX_FILE_SIZE} bytes (25 MB).",
        )

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")

    # Upload to S3/MinIO
    result = await upload_audio(
        file_bytes=file_bytes,
        original_filename=file.filename or "recording.webm",
        content_type=content_type,
    )

    voice_note_id = uuid.uuid4().hex

    return VoiceNoteUploadResponse(
        id=voice_note_id,
        filename=result["original_filename"],
        audio_url=result["audio_url"],
        file_size=result["file_size"],
        content_type=result["content_type"],
        status=VoiceNoteStatus.uploading,
        created_at=datetime.now(timezone.utc),
    )
