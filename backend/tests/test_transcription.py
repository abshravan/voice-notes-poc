"""Tests for transcription-related endpoints."""
from unittest.mock import patch, AsyncMock, MagicMock
from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


MOCK_STORAGE_RESULT = {
    "storage_key": "audio/test.webm",
    "audio_url": "http://localhost:9000/voice-notes/audio/test.webm",
    "file_size": 2048,
    "content_type": "audio/webm",
    "original_filename": "test.webm",
}

MOCK_TRANSCRIPT_RESULT = {
    "transcript": "Hello, this is a test recording about machine learning.",
    "language": "en",
    "duration_seconds": 5.2,
}


def test_transcribe_endpoint():
    """Test the standalone transcribe endpoint."""
    with patch(
        "app.api.routes.voice_notes.transcribe_audio",
        new_callable=AsyncMock,
        return_value=MOCK_TRANSCRIPT_RESULT,
    ):
        response = client.post(
            "/api/voice-notes/transcribe",
            files={"file": ("test.webm", BytesIO(b"\x00" * 1024), "audio/webm")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["transcript"] == "Hello, this is a test recording about machine learning."
        assert data["language"] == "en"
        assert data["duration_seconds"] == 5.2
        assert "voice_note_id" in data


def test_upload_and_transcribe_endpoint():
    """Test the unified upload + transcribe + structure endpoint."""
    with (
        patch(
            "app.api.routes.voice_notes.upload_audio",
            new_callable=AsyncMock,
            return_value=MOCK_STORAGE_RESULT,
        ),
        patch(
            "app.api.routes.voice_notes.transcribe_audio",
            new_callable=AsyncMock,
            return_value=MOCK_TRANSCRIPT_RESULT,
        ),
        patch(
            "app.api.routes.voice_notes.structure_transcript",
            new_callable=AsyncMock,
            return_value={
                "type": "note",
                "title": "Test recording about ML",
                "content": "A test recording about machine learning.",
                "tags": ["ml"],
                "action_items": [],
            },
        ),
    ):
        response = client.post(
            "/api/voice-notes/upload-and-transcribe",
            files={"file": ("test.webm", BytesIO(b"\x00" * 1024), "audio/webm")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["audio_url"] == "http://localhost:9000/voice-notes/audio/test.webm"
        assert data["transcript"] == "Hello, this is a test recording about machine learning."
        assert data["language"] == "en"
        assert data["duration_seconds"] == 5.2
        assert data["status"] == "done"
        assert data["file_size"] == 2048
        assert data["memory"] is not None
        assert data["memory"]["type"] == "note"


def test_transcribe_invalid_format():
    """Test that transcribe rejects non-audio files."""
    response = client.post(
        "/api/voice-notes/transcribe",
        files={"file": ("test.txt", BytesIO(b"hello"), "text/plain")},
    )
    assert response.status_code == 400


def test_transcription_service_no_api_key():
    """Test that transcription gracefully handles missing API key."""
    import asyncio
    from app.services.transcription import transcribe_audio

    with patch("app.services.transcription.settings") as mock_settings:
        mock_settings.openai_api_key = ""
        result = asyncio.get_event_loop().run_until_complete(
            transcribe_audio(b"\x00" * 100, "audio/webm")
        )
        assert "unavailable" in result["transcript"].lower()
        assert result["language"] == "unknown"
