"""API routes for managing persisted memories and semantic search."""

import logging

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services import crud
from app.services.embeddings import generate_embedding
from app.services.vector_store import search_memories as vector_search
from app.schemas.memory import MemoryResponse, SearchQuery, SearchResult

logger = logging.getLogger(__name__)

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


@router.post("/search", response_model=list[SearchResult])
async def search_memories(
    query: SearchQuery,
    db: AsyncSession = Depends(get_db),
):
    """
    Semantic search across memories using vector similarity.
    Embeds the query, searches Qdrant, then hydrates results from the DB.
    """
    if not query.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    # Generate embedding for the search query
    embedding = await generate_embedding(query.query)
    if embedding is None:
        raise HTTPException(
            status_code=503,
            detail="Embedding service unavailable. Check OpenAI API key.",
        )

    # Search Qdrant for nearest vectors
    try:
        vector_results = await vector_search(
            query_embedding=embedding,
            limit=query.limit,
        )
    except Exception as e:
        logger.error("Vector search failed: %s", e)
        raise HTTPException(
            status_code=503,
            detail="Vector search unavailable. Check Qdrant connection.",
        )

    # Hydrate results from DB for full memory data
    results = []
    for vr in vector_results:
        mem = await crud.get_memory(db, vr["id"])
        if mem:
            results.append(
                SearchResult(
                    memory=_to_response(mem),
                    score=vr["score"],
                )
            )

    return results


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
