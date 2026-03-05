"""Tests for the memories listing/CRUD endpoints."""
from datetime import datetime, timezone
from unittest.mock import patch, AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# Re-export override_db fixture from conftest for explicit use in tests


def test_list_memories_empty():
    """Test listing memories returns empty list when DB is empty."""
    response = client.get("/api/memories")
    assert response.status_code == 200
    assert response.json() == []


def test_get_memory_not_found():
    """Test getting a non-existent memory returns 404."""
    response = client.get("/api/memories/nonexistent123")
    assert response.status_code == 404


def test_delete_memory_not_found():
    """Test deleting a non-existent memory returns 404."""
    response = client.delete("/api/memories/nonexistent123")
    assert response.status_code == 404


def test_list_memories_with_type_filter():
    """Test that type filter param is accepted."""
    response = client.get("/api/memories?type=idea")
    assert response.status_code == 200
    assert response.json() == []


def test_list_memories_with_pagination():
    """Test that limit and offset params are accepted."""
    response = client.get("/api/memories?limit=10&offset=5")
    assert response.status_code == 200
    assert response.json() == []


def test_update_memory_not_found():
    """Test patching a non-existent memory returns 404."""
    response = client.patch(
        "/api/memories/nonexistent123",
        json={"title": "Updated Title"},
    )
    assert response.status_code == 404


def test_update_memory_empty_body():
    """Test patching with no fields returns 400."""
    response = client.patch("/api/memories/some_id", json={})
    assert response.status_code == 400
    assert "No fields" in response.json()["detail"]


def test_update_memory_success(override_db):
    """Test successfully updating a memory."""
    fake_mem = MagicMock()
    fake_mem.id = "mem123"
    fake_mem.type = "idea"
    fake_mem.title = "Updated Title"
    fake_mem.content = "content"
    fake_mem.tags = ["test"]
    fake_mem.action_items = []
    fake_mem.audio_url = None
    fake_mem.transcript = "transcript"
    fake_mem.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    fake_mem.updated_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    fake_mem.status = "processed"

    with patch("app.services.crud.update_memory", new_callable=AsyncMock, return_value=fake_mem):
        response = client.patch(
            "/api/memories/mem123",
            json={"title": "Updated Title"},
        )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


def test_audio_proxy_not_found():
    """Test audio proxy for non-existent memory returns 404."""
    response = client.get("/api/memories/nonexistent/audio")
    assert response.status_code == 404


def test_audio_proxy_no_audio(override_db):
    """Test audio proxy when memory has no audio_url."""
    fake_mem = MagicMock()
    fake_mem.audio_url = None

    with patch("app.services.crud.get_memory", new_callable=AsyncMock, return_value=fake_mem):
        response = client.get("/api/memories/mem123/audio")
    assert response.status_code == 404
    assert "No audio" in response.json()["detail"]


def test_audio_proxy_success(override_db):
    """Test audio proxy streams audio bytes."""
    fake_mem = MagicMock()
    fake_mem.audio_url = "http://minio:9000/voice-notes/audio/abc123.webm"

    with (
        patch("app.services.crud.get_memory", new_callable=AsyncMock, return_value=fake_mem),
        patch("app.api.routes.memories.download_audio", new_callable=AsyncMock, return_value=b"fake-audio"),
    ):
        response = client.get("/api/memories/mem123/audio")
    assert response.status_code == 200
    assert response.content == b"fake-audio"
    assert response.headers["content-type"] == "audio/webm"
