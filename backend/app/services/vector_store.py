"""Qdrant vector store — stores and searches memory embeddings."""

import logging

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams,
)

from app.core.config import settings
from app.services.embeddings import EMBEDDING_DIM

logger = logging.getLogger(__name__)

_client: QdrantClient | None = None


def _get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
        )
    return _client


def ensure_collection() -> None:
    """Create the Qdrant collection if it doesn't already exist."""
    client = _get_client()
    collections = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection not in collections:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(
                size=EMBEDDING_DIM,
                distance=Distance.COSINE,
            ),
        )
        logger.info("Created Qdrant collection: %s", settings.qdrant_collection)
    else:
        logger.info("Qdrant collection exists: %s", settings.qdrant_collection)


async def upsert_memory(
    memory_id: str,
    embedding: list[float],
    payload: dict,
) -> None:
    """Insert or update a memory vector in Qdrant."""
    client = _get_client()
    client.upsert(
        collection_name=settings.qdrant_collection,
        points=[
            PointStruct(
                id=memory_id,
                vector=embedding,
                payload=payload,
            )
        ],
    )
    logger.info("Upserted vector for memory %s", memory_id)


async def search_memories(
    query_embedding: list[float],
    limit: int = 10,
    memory_type: str | None = None,
) -> list[dict]:
    """
    Search for the nearest memories by cosine similarity.
    Returns list of dicts with 'id', 'score', and 'payload'.
    """
    client = _get_client()

    query_filter = None
    if memory_type:
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        query_filter = Filter(
            must=[FieldCondition(key="type", match=MatchValue(value=memory_type))]
        )

    results = client.query_points(
        collection_name=settings.qdrant_collection,
        query=query_embedding,
        limit=limit,
        query_filter=query_filter,
        with_payload=True,
    )

    return [
        {
            "id": str(point.id),
            "score": point.score,
            "payload": point.payload,
        }
        for point in results.points
    ]


async def delete_memory(memory_id: str) -> None:
    """Remove a memory vector from Qdrant."""
    client = _get_client()
    from qdrant_client.models import PointIdsList
    client.delete(
        collection_name=settings.qdrant_collection,
        points_selector=PointIdsList(points=[memory_id]),
    )
    logger.info("Deleted vector for memory %s", memory_id)
