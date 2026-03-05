import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.storage import (
    upload_audio,
    ALLOWED_AUDIO_TYPES,
    MAX_FILE_SIZE,
)
from app.services.transcription import transcribe_audio
from app.services.structuring import structure_transcript
from app.services import crud
from app.schemas.voice_note import (
    VoiceNoteUploadResponse,
    TranscriptionResponse,
    StructureRequest,
    StructureResponse,
    StructuredMemory,
    VoiceNoteFullResponse,
)
from app.schemas.memory import MemoryResponse, MemoryType, MemoryStatus, VoiceNoteStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice-notes", tags=["voice-notes"])


@router.post("/upload", response_model=VoiceNoteUploadResponse)
async def upload_voice_note(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload an audio file without transcription or structuring."""
    file_bytes, content_type, filename = await _validate_and_read(file)

    result = await upload_audio(
        file_bytes=file_bytes,
        original_filename=filename,
        content_type=content_type,
    )

    vn = await crud.create_voice_note(
        db,
        filename=result["original_filename"],
        audio_url=result["audio_url"],
        file_size=result["file_size"],
        content_type=result["content_type"],
        status="uploading",
    )

    return VoiceNoteUploadResponse(
        id=vn.id,
        filename=vn.filename,
        audio_url=vn.audio_url,
        file_size=vn.file_size,
        content_type=vn.content_type,
        status=VoiceNoteStatus.uploading,
        created_at=vn.created_at,
    )


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_voice_note(file: UploadFile = File(...)):
    """Transcribe an audio file directly (without storage or structuring)."""
    file_bytes, content_type, _ = await _validate_and_read(file)
    transcript_result = await transcribe_audio(file_bytes, content_type)

    return TranscriptionResponse(
        voice_note_id=uuid.uuid4().hex,
        transcript=transcript_result["transcript"],
        language=transcript_result["language"],
        duration_seconds=transcript_result["duration_seconds"],
    )


@router.post("/structure", response_model=StructureResponse)
async def structure_text(request: StructureRequest):
    """Structure a transcript into a typed memory using the LLM."""
    if not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")

    result = await structure_transcript(request.transcript)
    return StructureResponse(memory=StructuredMemory(**result))


@router.post("/upload-and-transcribe", response_model=VoiceNoteFullResponse)
async def upload_and_transcribe(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Full pipeline: upload → transcribe → structure → persist.
    This is the primary endpoint the frontend uses.
    """
    file_bytes, content_type, filename = await _validate_and_read(file)

    # Step 1: Store in S3
    storage_result = await upload_audio(
        file_bytes=file_bytes,
        original_filename=filename,
        content_type=content_type,
    )

    # Step 2: Transcribe with Whisper
    transcript_result = await transcribe_audio(file_bytes, content_type)
    transcript = transcript_result["transcript"]

    # Step 3: Structure with LLM
    memory_data = None
    memory_id = None
    if transcript and not transcript.startswith("[Transcription unavailable"):
        structured = await structure_transcript(transcript)
        memory_data = StructuredMemory(**structured)

        # Step 4: Persist memory to DB
        mem = await crud.create_memory(
            db,
            type=structured["type"],
            title=structured["title"],
            content=structured["content"],
            transcript=transcript,
            tags=structured["tags"],
            action_items=structured.get("action_items", []),
            audio_url=storage_result["audio_url"],
            status="processed",
        )
        memory_id = mem.id

    # Step 5: Persist voice note to DB
    vn = await crud.create_voice_note(
        db,
        filename=storage_result["original_filename"],
        audio_url=storage_result["audio_url"],
        file_size=storage_result["file_size"],
        content_type=storage_result["content_type"],
        duration_seconds=transcript_result["duration_seconds"],
        transcript=transcript,
        language=transcript_result["language"],
        status="done",
        memory_id=memory_id,
    )

    return VoiceNoteFullResponse(
        id=vn.id,
        filename=vn.filename,
        audio_url=vn.audio_url,
        file_size=vn.file_size,
        content_type=vn.content_type,
        transcript=transcript,
        language=transcript_result["language"],
        duration_seconds=transcript_result["duration_seconds"],
        memory=memory_data,
        status=VoiceNoteStatus.done,
        created_at=vn.created_at,
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
