"""API routes for managing persisted memories."""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services import crud
from app.schemas.memory import MemoryResponse, MemoryStatus

router = APIRouter(prefix="/api/memories", tags=["memories"])


@router.get("", response_model=list[MemoryResponse])
async def list_memories(
    type: str | None = Query(None, description="Filter by memory type: idea, task, note"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all memories, optionally filtered by type."""
    memories = await crud.list_memories(db, memory_type=type, limit=limit, offset=offset)
    return [_to_response(m) for m in memories]


@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(memory_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single memory by ID."""
    mem = await crud.get_memory(db, memory_id)
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found.")
    return _to_response(mem)


@router.delete("/{memory_id}", status_code=204)
async def delete_memory(memory_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a memory by ID."""
    deleted = await crud.delete_memory(db, memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found.")


def _to_response(mem) -> MemoryResponse:
    return MemoryResponse(
        id=mem.id,
        type=mem.type,
        title=mem.title,
        content=mem.content,
        tags=mem.tags or [],
        audio_url=mem.audio_url,
        transcript=mem.transcript,
        created_at=mem.created_at,
        updated_at=mem.updated_at,
        status=mem.status,
    )
