import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import health
from app.api.routes import voice_notes
from app.api.routes import memories

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure audio storage directory exists
    try:
        from app.services.storage import ensure_bucket_exists
        ensure_bucket_exists()
    except Exception as e:
        logger.warning("Could not create audio storage directory: %s", e)

    # Startup: ensure Qdrant collection exists
    try:
        from app.services.vector_store import ensure_collection
        ensure_collection()
        logger.info("Qdrant collection verified: %s", settings.qdrant_collection)
    except Exception as e:
        logger.warning("Could not verify Qdrant collection (Qdrant may not be running): %s", e)

    yield


app = FastAPI(
    title=settings.app_name,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Build allowed origins list
_origins = [o.strip() for o in settings.backend_cors_origins.split(",") if o.strip()]

# CORS — allow the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https?://localhost(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Catch-all exception handler so 500s still include CORS headers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


# Register routes
app.include_router(health.router, tags=["health"])
app.include_router(voice_notes.router)
app.include_router(memories.router)
