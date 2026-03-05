import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import health
from app.api.routes import voice_notes
from app.api.routes import memories

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure S3 bucket exists
    try:
        from app.services.storage import ensure_bucket_exists
        ensure_bucket_exists()
        logger.info("S3 bucket verified: %s", settings.s3_bucket)
    except Exception as e:
        logger.warning("Could not verify S3 bucket (MinIO may not be running): %s", e)
    yield


app = FastAPI(
    title=settings.app_name,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router, tags=["health"])
app.include_router(voice_notes.router)
app.include_router(memories.router)
