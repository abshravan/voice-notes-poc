"""Shared test fixtures — provides a mock async DB session."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.database import get_db
from app.main import app


class FakeSession:
    """A minimal fake AsyncSession that collects added objects."""

    def __init__(self):
        self.added = []
        self._id_counter = 0

    def add(self, obj):
        self.added.append(obj)
        # Auto-assign an id and timestamps if missing
        if hasattr(obj, "id") and not obj.id:
            self._id_counter += 1
            obj.id = f"fake{self._id_counter:08d}"
        now = datetime.now(timezone.utc)
        if hasattr(obj, "created_at") and not obj.created_at:
            obj.created_at = now
        if hasattr(obj, "updated_at") and not obj.updated_at:
            obj.updated_at = now

    async def flush(self):
        pass

    async def commit(self):
        pass

    async def rollback(self):
        pass

    async def execute(self, stmt):
        return MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[]))))

    async def get(self, model_class, pk):
        return None

    async def delete(self, obj):
        pass


@pytest.fixture(autouse=True)
def override_db():
    """Override the DB dependency with a fake session for all tests."""
    fake = FakeSession()

    async def _fake_db():
        yield fake

    app.dependency_overrides[get_db] = _fake_db
    yield fake
    app.dependency_overrides.pop(get_db, None)
