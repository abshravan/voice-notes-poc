"""API routes for managing persisted memories and semantic search."""

import logging

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services import crud
from app.services.embeddings import generate_embedding
from app.services.storage import download_audio
from app.services.vector_store import search_memories as vector_search
from app.schemas.memory import MemoryResponse, MemoryUpdate, SearchQuery, SearchResult

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

    embedding = await generate_embedding(query.query)
    if embedding is None:
        raise HTTPException(
            status_code=503,
            detail="Embedding service unavailable. Check OpenAI API key.",
        )

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


@router.patch("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    body: MemoryUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update editable fields on a memory."""
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    mem = await crud.update_memory(db, memory_id, **updates)
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found.")

    await db.commit()
    return _to_response(mem)


@router.get("/{memory_id}/audio")
async def get_memory_audio(memory_id: str, db: AsyncSession = Depends(get_db)):
    """Proxy audio from S3/MinIO so the browser can play it directly."""
    mem = await crud.get_memory(db, memory_id)
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found.")
    if not mem.audio_url:
        raise HTTPException(status_code=404, detail="No audio associated with this memory.")

    # Extract storage key from the audio URL
    # URL format: http://minio:9000/voice-notes/audio/<uuid>.ext
    try:
        storage_key = "/".join(mem.audio_url.split("/")[-2:])  # "audio/<uuid>.webm"
        audio_bytes = await download_audio(storage_key)
    except Exception as e:
        logger.error("Failed to download audio for memory %s: %s", memory_id, e)
        raise HTTPException(status_code=502, detail="Failed to retrieve audio file.")

    ext = storage_key.rsplit(".", 1)[-1] if "." in storage_key else "webm"
    content_types = {
        "webm": "audio/webm",
        "wav": "audio/wav",
        "mp3": "audio/mpeg",
        "m4a": "audio/mp4",
        "ogg": "audio/ogg",
        "flac": "audio/flac",
    }

    return Response(
        content=audio_bytes,
        media_type=content_types.get(ext, "audio/webm"),
        headers={"Content-Disposition": f'inline; filename="memory-{memory_id}.{ext}"'},
    )


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
        action_items=mem.action_items or [],
        audio_url=mem.audio_url,
        transcript=mem.transcript,
        created_at=mem.created_at,
        updated_at=mem.updated_at,
        status=mem.status,
    )
