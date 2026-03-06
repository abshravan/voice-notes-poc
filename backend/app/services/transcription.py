import logging
import tempfile
import os

from app.core.config import settings

logger = logging.getLogger(__name__)

# Lazy-loaded whisper model
_whisper_model = None


def _get_whisper_model():
    """Load whisper model on first use to avoid slow startup."""
    global _whisper_model
    if _whisper_model is None:
        import whisper
        model_name = settings.whisper_model
        logger.info("Loading Whisper model: %s", model_name)
        _whisper_model = whisper.load_model(model_name)
        logger.info("Whisper model loaded successfully")
    return _whisper_model


async def transcribe_audio(file_bytes: bytes, content_type: str) -> dict:
    """
    Transcribe audio bytes using local Whisper model.
    Returns dict with transcript text and detected language.
    """
    ext = _extension_from_content_type(content_type)
    suffix = ext or ".webm"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        model = _get_whisper_model()
        result = model.transcribe(tmp_path)

        transcript = result.get("text", "").strip()
        language = result.get("language", "unknown")

        # Estimate duration from segments
        segments = result.get("segments", [])
        duration = segments[-1]["end"] if segments else 0.0

        logger.info(
            "Transcription complete: %d chars, language=%s, duration=%.1fs",
            len(transcript), language, duration,
        )

        return {
            "transcript": transcript,
            "language": language,
            "duration_seconds": duration,
        }
    except Exception as e:
        logger.error("Whisper transcription failed: %s", e)
        return {
            "transcript": f"[Transcription failed: {e}]",
            "language": "unknown",
            "duration_seconds": 0.0,
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
