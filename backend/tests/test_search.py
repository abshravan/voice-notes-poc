"""Tests for semantic search endpoint and embedding service."""
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.embeddings import generate_embedding

client = TestClient(app)

MOCK_EMBEDDING = [0.1] * 1536


def test_search_empty_query():
    """Test search rejects empty query."""
    response = client.post(
        "/api/memories/search",
        json={"query": "   "},
    )
    assert response.status_code == 400


def test_search_no_api_key():
    """Test search returns 503 when OpenAI key is missing."""
    with patch(
        "app.api.routes.memories.generate_embedding",
        new_callable=AsyncMock,
        return_value=None,
    ):
        response = client.post(
            "/api/memories/search",
            json={"query": "machine learning ideas"},
        )
        assert response.status_code == 503
        assert "Embedding service" in response.json()["detail"]


def test_search_qdrant_unavailable():
    """Test search returns 503 when Qdrant is down."""
    with (
        patch(
            "app.api.routes.memories.generate_embedding",
            new_callable=AsyncMock,
            return_value=MOCK_EMBEDDING,
        ),
        patch(
            "app.api.routes.memories.vector_search",
            new_callable=AsyncMock,
            side_effect=Exception("Connection refused"),
        ),
    ):
        response = client.post(
            "/api/memories/search",
            json={"query": "machine learning ideas"},
        )
        assert response.status_code == 503
        assert "Vector search" in response.json()["detail"]


def test_search_returns_results():
    """Test search returns hydrated results when everything works."""
    # Create a mock memory object
    mock_mem = MagicMock()
    mock_mem.id = "mem123"
    mock_mem.type = "idea"
    mock_mem.title = "ML Pipeline"
    mock_mem.content = "Build a machine learning pipeline"
    mock_mem.tags = ["ml", "pipeline"]
    mock_mem.audio_url = None
    mock_mem.transcript = "Let's build an ML pipeline"
    mock_mem.created_at = datetime(2026, 3, 5, tzinfo=timezone.utc)
    mock_mem.updated_at = datetime(2026, 3, 5, tzinfo=timezone.utc)
    mock_mem.status = "processed"

    with (
        patch(
            "app.api.routes.memories.generate_embedding",
            new_callable=AsyncMock,
            return_value=MOCK_EMBEDDING,
        ),
        patch(
            "app.api.routes.memories.vector_search",
            new_callable=AsyncMock,
            return_value=[
                {"id": "mem123", "score": 0.92, "payload": {"title": "ML Pipeline"}},
            ],
        ),
        patch(
            "app.api.routes.memories.crud.get_memory",
            new_callable=AsyncMock,
            return_value=mock_mem,
        ),
    ):
        response = client.post(
            "/api/memories/search",
            json={"query": "machine learning"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["memory"]["title"] == "ML Pipeline"
        assert data[0]["score"] == 0.92


def test_embedding_no_api_key():
    """Test embedding returns None without API key."""
    import asyncio
    with patch("app.services.embeddings.settings") as mock_settings:
        mock_settings.openai_api_key = ""
        result = asyncio.get_event_loop().run_until_complete(
            generate_embedding("test text")
        )
        assert result is None


def test_embedding_empty_text():
    """Test embedding returns None for empty text."""
    import asyncio
    result = asyncio.get_event_loop().run_until_complete(
        generate_embedding("   ")
    )
    assert result is None
