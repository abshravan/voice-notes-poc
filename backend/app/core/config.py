from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "Voice Memory API"
    debug: bool = False

    # Database (defaults to local SQLite; set to postgresql+asyncpg://... for Postgres)
    database_url: str = "sqlite+aiosqlite:///./voice_memory.db"

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "memories"

    # Audio file storage (local filesystem)
    audio_storage_path: str = "./audio_files"

    # Whisper (local model)
    whisper_model: str = "small"

    # Ollama (local LLM)
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "mistral"
    ollama_embed_model: str = "nomic-embed-text"

    # CORS
    backend_cors_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
