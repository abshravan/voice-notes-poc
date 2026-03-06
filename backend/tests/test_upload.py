"""Tests for the voice note upload endpoint."""
from unittest.mock import patch, AsyncMock
from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _make_audio_file(size: int = 1024, content_type: str = "audio/webm"):
    """Create a fake audio file for testing."""
    return BytesIO(b"\x00" * size)


def test_upload_success():
    """Test successful audio upload."""
    with patch("app.api.routes.voice_notes.upload_audio", new_callable=AsyncMock) as mock_upload:
        mock_upload.return_value = {
            "storage_key": "audio/test.webm",
            "audio_url": "audio/test.webm",
            "file_size": 1024,
            "content_type": "audio/webm",
            "original_filename": "test.webm",
        }

        response = client.post(
            "/api/voice-notes/upload",
            files={"file": ("test.webm", _make_audio_file(), "audio/webm")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "test.webm"
        assert data["file_size"] == 1024
        assert data["status"] == "uploading"
        assert "id" in data
        assert "created_at" in data


def test_upload_invalid_type():
    """Test rejection of non-audio file types."""
    response = client.post(
        "/api/voice-notes/upload",
        files={"file": ("test.txt", BytesIO(b"hello"), "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported audio format" in response.json()["detail"]


def test_upload_empty_file():
    """Test rejection of empty files."""
    response = client.post(
        "/api/voice-notes/upload",
        files={"file": ("test.webm", BytesIO(b""), "audio/webm")},
    )
    assert response.status_code == 400
    assert "Empty file" in response.json()["detail"]


def test_upload_too_large():
    """Test rejection of files exceeding 25MB."""
    big_file = BytesIO(b"\x00" * (26 * 1024 * 1024))  # 26 MB
    response = client.post(
        "/api/voice-notes/upload",
        files={"file": ("big.webm", big_file, "audio/webm")},
    )
    assert response.status_code == 400
    assert "File too large" in response.json()["detail"]
