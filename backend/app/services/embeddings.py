"""Generate text embeddings via Ollama's local embedding API."""

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 768  # nomic-embed-text default dimension


async def generate_embedding(text: str) -> list[float] | None:
    """
    Generate a vector embedding for the given text using Ollama.
    Returns None if Ollama is not reachable.
    """
    if not text.strip():
        return None

    ollama_url = settings.ollama_url
    embed_model = settings.ollama_embed_model

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{ollama_url}/api/embed",
                json={
                    "model": embed_model,
                    "input": text[:8000],
                },
            )
            response.raise_for_status()

        data = response.json()
        embeddings = data.get("embeddings", [])
        if not embeddings:
            logger.warning("No embeddings returned from Ollama")
            return None

        embedding = embeddings[0]
        logger.info("Generated embedding: dim=%d", len(embedding))
        return embedding

    except Exception as e:
        logger.error("Embedding generation failed: %s", e)
        return None
