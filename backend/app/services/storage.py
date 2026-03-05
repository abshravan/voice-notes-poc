import uuid
import logging
from io import BytesIO

import boto3
from botocore.exceptions import ClientError

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


def _get_s3_client():
    """Create a boto3 S3 client pointing at MinIO (or real S3)."""
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
    )


def ensure_bucket_exists() -> None:
    """Create the audio bucket if it doesn't exist yet."""
    client = _get_s3_client()
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
    except ClientError:
        client.create_bucket(Bucket=settings.s3_bucket)
        logger.info("Created S3 bucket: %s", settings.s3_bucket)


async def upload_audio(file_bytes: bytes, original_filename: str, content_type: str) -> dict:
    """
    Upload audio bytes to S3/MinIO.
    Returns dict with storage key and public URL.
    """
    ext = _extension_from_mime(content_type)
    storage_key = f"audio/{uuid.uuid4().hex}{ext}"

    client = _get_s3_client()
    client.upload_fileobj(
        BytesIO(file_bytes),
        settings.s3_bucket,
        storage_key,
        ExtraArgs={"ContentType": content_type},
    )

    # Construct the URL for later retrieval
    audio_url = f"{settings.s3_endpoint}/{settings.s3_bucket}/{storage_key}"

    return {
        "storage_key": storage_key,
        "audio_url": audio_url,
        "file_size": len(file_bytes),
        "content_type": content_type,
        "original_filename": original_filename,
    }


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
