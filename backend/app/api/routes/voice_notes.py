import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.storage import (
    upload_audio,
    ALLOWED_AUDIO_TYPES,
    MAX_FILE_SIZE,
)
from app.services.transcription import transcribe_audio
from app.schemas.voice_note import (
    VoiceNoteUploadResponse,
    TranscriptionResponse,
    VoiceNoteFullResponse,
)
from app.schemas.memory import VoiceNoteStatus

router = APIRouter(prefix="/api/voice-notes", tags=["voice-notes"])


@router.post("/upload", response_model=VoiceNoteUploadResponse)
async def upload_voice_note(file: UploadFile = File(...)):
    """
    Upload an audio file without transcription.
    Use POST /upload-and-transcribe for the full pipeline.
    """
    file_bytes, content_type, filename = await _validate_and_read(file)

    result = await upload_audio(
        file_bytes=file_bytes,
        original_filename=filename,
        content_type=content_type,
    )

    return VoiceNoteUploadResponse(
        id=uuid.uuid4().hex,
        filename=result["original_filename"],
        audio_url=result["audio_url"],
        file_size=result["file_size"],
        content_type=result["content_type"],
        status=VoiceNoteStatus.uploading,
        created_at=datetime.now(timezone.utc),
    )


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_voice_note(file: UploadFile = File(...)):
    """
    Transcribe an audio file directly (without storing in S3).
    Useful for quick transcription without persistence.
    """
    file_bytes, content_type, _ = await _validate_and_read(file)

    transcript_result = await transcribe_audio(file_bytes, content_type)

    return TranscriptionResponse(
        voice_note_id=uuid.uuid4().hex,
        transcript=transcript_result["transcript"],
        language=transcript_result["language"],
        duration_seconds=transcript_result["duration_seconds"],
    )


@router.post("/upload-and-transcribe", response_model=VoiceNoteFullResponse)
async def upload_and_transcribe(file: UploadFile = File(...)):
    """
    Full pipeline: upload audio to S3, then transcribe with Whisper.
    This is the primary endpoint the frontend uses.
    """
    file_bytes, content_type, filename = await _validate_and_read(file)

    # Step 1: Store in S3
    storage_result = await upload_audio(
        file_bytes=file_bytes,
        original_filename=filename,
        content_type=content_type,
    )

    # Step 2: Transcribe
    transcript_result = await transcribe_audio(file_bytes, content_type)

    voice_note_id = uuid.uuid4().hex

    return VoiceNoteFullResponse(
        id=voice_note_id,
        filename=storage_result["original_filename"],
        audio_url=storage_result["audio_url"],
        file_size=storage_result["file_size"],
        content_type=storage_result["content_type"],
        transcript=transcript_result["transcript"],
        language=transcript_result["language"],
        duration_seconds=transcript_result["duration_seconds"],
        status=VoiceNoteStatus.done,
        created_at=datetime.now(timezone.utc),
    )


async def _validate_and_read(file: UploadFile) -> tuple[bytes, str, str]:
    """Shared validation: check MIME type, read bytes, check size."""
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {content_type}. "
                   f"Allowed: {', '.join(sorted(ALLOWED_AUDIO_TYPES))}",
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {len(file_bytes)} bytes. Max: {MAX_FILE_SIZE} bytes (25 MB).",
        )

    filename = file.filename or "recording.webm"
    return file_bytes, content_type, filename
