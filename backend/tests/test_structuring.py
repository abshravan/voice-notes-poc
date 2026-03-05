"""Tests for memory structuring service and endpoint."""
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.structuring import structure_transcript, _fallback_structure

client = TestClient(app)

MOCK_STRUCTURED = {
    "type": "idea",
    "title": "Vector database for memory search",
    "content": "Use a vector database like Qdrant to enable semantic search across voice memories.",
    "tags": ["vector-db", "search", "qdrant"],
    "action_items": [],
}

MOCK_TASK_STRUCTURED = {
    "type": "task",
    "title": "Set up CI/CD pipeline",
    "content": "Need to configure GitHub Actions for automated testing and deployment.",
    "tags": ["devops", "ci-cd"],
    "action_items": ["Create GitHub Actions workflow", "Add test stage", "Configure deployment"],
}


def test_structure_endpoint():
    """Test the standalone structure endpoint."""
    with patch(
        "app.api.routes.voice_notes.structure_transcript",
        new_callable=AsyncMock,
        return_value=MOCK_STRUCTURED,
    ):
        response = client.post(
            "/api/voice-notes/structure",
            json={"transcript": "I had an idea about using vector databases..."},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["memory"]["type"] == "idea"
        assert data["memory"]["title"] == "Vector database for memory search"
        assert "vector-db" in data["memory"]["tags"]
        assert data["memory"]["action_items"] == []


def test_structure_endpoint_empty_transcript():
    """Test structure endpoint rejects empty transcript."""
    response = client.post(
        "/api/voice-notes/structure",
        json={"transcript": "   "},
    )
    assert response.status_code == 400


def test_full_pipeline_with_structuring():
    """Test upload-and-transcribe now includes memory structuring."""
    with (
        patch(
            "app.api.routes.voice_notes.upload_audio",
            new_callable=AsyncMock,
            return_value={
                "storage_key": "audio/test.webm",
                "audio_url": "http://localhost:9000/voice-notes/audio/test.webm",
                "file_size": 2048,
                "content_type": "audio/webm",
                "original_filename": "test.webm",
            },
        ),
        patch(
            "app.api.routes.voice_notes.transcribe_audio",
            new_callable=AsyncMock,
            return_value={
                "transcript": "I need to set up the CI/CD pipeline this week.",
                "language": "en",
                "duration_seconds": 4.5,
            },
        ),
        patch(
            "app.api.routes.voice_notes.structure_transcript",
            new_callable=AsyncMock,
            return_value=MOCK_TASK_STRUCTURED,
        ),
    ):
        response = client.post(
            "/api/voice-notes/upload-and-transcribe",
            files={"file": ("test.webm", BytesIO(b"\x00" * 1024), "audio/webm")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["transcript"] == "I need to set up the CI/CD pipeline this week."
        assert data["memory"] is not None
        assert data["memory"]["type"] == "task"
        assert data["memory"]["title"] == "Set up CI/CD pipeline"
        assert len(data["memory"]["action_items"]) == 3
        assert data["status"] == "done"


def test_fallback_structure_task():
    """Test heuristic fallback detects tasks."""
    result = _fallback_structure("I need to finish the report by Friday")
    assert result["type"] == "task"


def test_fallback_structure_idea():
    """Test heuristic fallback detects ideas."""
    result = _fallback_structure("What if we built a mobile app for this?")
    assert result["type"] == "idea"


def test_fallback_structure_note():
    """Test heuristic fallback defaults to note."""
    result = _fallback_structure("The weather was nice today and I went for a walk")
    assert result["type"] == "note"


def test_fallback_long_title_truncation():
    """Test that long transcripts get truncated titles."""
    long_text = "A" * 100 + ". More content here."
    result = _fallback_structure(long_text)
    assert len(result["title"]) <= 60
