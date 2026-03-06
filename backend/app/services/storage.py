import uuid
import logging
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)

# Allowed audio MIME types
ALLOWED_AUDIO_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
    "audio/flac",
    "audio/x-wav",
    "audio/x-m4a",
}

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


def _audio_dir() -> Path:
    """Return the local directory for storing audio files, creating it if needed."""
    d = Path(settings.audio_storage_path)
    d.mkdir(parents=True, exist_ok=True)
    return d


def ensure_bucket_exists() -> None:
    """Create the local audio storage directory."""
    d = _audio_dir()
    logger.info("Audio storage directory: %s", d.resolve())


async def upload_audio(file_bytes: bytes, original_filename: str, content_type: str) -> dict:
    """Save audio bytes to the local filesystem."""
    ext = _extension_from_mime(content_type)
    filename = f"{uuid.uuid4().hex}{ext}"
    storage_key = f"audio/{filename}"
    filepath = _audio_dir() / filename

    filepath.write_bytes(file_bytes)
    logger.info("Saved audio file: %s (%d bytes)", filepath, len(file_bytes))

    return {
        "storage_key": storage_key,
        "audio_url": storage_key,
        "file_size": len(file_bytes),
        "content_type": content_type,
        "original_filename": original_filename,
    }


async def download_audio(audio_url_or_key: str) -> bytes:
    """Read audio bytes from local filesystem."""
    filename = _extract_filename(audio_url_or_key)
    filepath = _audio_dir() / filename

    if not filepath.exists():
        raise FileNotFoundError(f"Audio file not found: {filepath}")

    return filepath.read_bytes()


def _extract_filename(audio_url_or_key: str) -> str:
    """Extract just the filename from a key or legacy URL."""
    if audio_url_or_key.startswith("http"):
        audio_url_or_key = audio_url_or_key.split("/")[-1]
    if audio_url_or_key.startswith("audio/"):
        audio_url_or_key = audio_url_or_key[6:]
    return audio_url_or_key


def _extension_from_mime(mime: str) -> str:
    """Map MIME type to file extension."""
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
    return mapping.get(mime, ".webm")
