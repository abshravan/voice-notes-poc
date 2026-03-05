"""Tests for the memories listing/CRUD endpoints."""
from datetime import datetime, timezone
from unittest.mock import patch, AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


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
