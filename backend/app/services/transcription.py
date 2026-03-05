import logging
import tempfile
import os
from io import BytesIO

from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


async def transcribe_audio(file_bytes: bytes, content_type: str) -> dict:
    """
    Transcribe audio bytes using OpenAI's Whisper API.

    Returns dict with transcript text and detected language.
    Falls back to a placeholder if no API key is configured.
    """
    if not settings.openai_api_key:
        logger.warning("No OpenAI API key configured — returning placeholder transcript")
        return {
            "transcript": "[Transcription unavailable — set OPENAI_API_KEY]",
            "language": "unknown",
            "duration_seconds": 0.0,
        }

    client = OpenAI(api_key=settings.openai_api_key)

    # Whisper API requires a file-like object with a filename
    ext = _extension_from_content_type(content_type)
    suffix = ext or ".webm"

    # Write to a temp file since the API needs a named file
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
            )

        transcript = response.text.strip()
        language = getattr(response, "language", "unknown")
        duration = getattr(response, "duration", 0.0)

        logger.info(
            "Transcription complete: %d chars, language=%s, duration=%.1fs",
            len(transcript), language, duration,
        )

        return {
            "transcript": transcript,
            "language": language,
            "duration_seconds": duration,
        }
    finally:
        os.unlink(tmp_path)


def _extension_from_content_type(content_type: str) -> str:
    mapping = {
        "audio/webm": ".webm",
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/mpeg": ".mp3",
        "audio/mp4": ".m4a",
        "audio/x-m4a": ".m4a",
        "audio/ogg": ".ogg",
        "audio/flac": ".flac",
    }
    return mapping.get(content_type, ".webm")
