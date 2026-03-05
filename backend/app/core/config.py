from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "Voice Memory API"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://voice_user:voice_pass_dev@localhost:5432/voice_memory"

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "memories"

    # S3 / MinIO
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "voice-notes"
    s3_region: str = "us-east-1"

    # OpenAI
    openai_api_key: str = ""

    # CORS
    backend_cors_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
