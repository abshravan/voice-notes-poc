"""Generate text embeddings via OpenAI's embedding API."""

import logging

from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536


async def generate_embedding(text: str) -> list[float] | None:
    """
    Generate a vector embedding for the given text.
    Returns None if OpenAI API key is not configured.
    """
    if not settings.openai_api_key:
        logger.warning("No OpenAI API key — skipping embedding generation")
        return None

    if not text.strip():
        return None

    client = OpenAI(api_key=settings.openai_api_key)

    try:
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text[:8000],  # trim to stay within token limits
        )
        embedding = response.data[0].embedding
        logger.info("Generated embedding: dim=%d", len(embedding))
        return embedding
    except Exception as e:
        logger.error("Embedding generation failed: %s", e)
        return None
