"""VoiceNote ORM model — stores uploaded audio recordings and their transcripts."""

from sqlalchemy import Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, new_id


class VoiceNote(Base, TimestampMixin):
    __tablename__ = "voice_notes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    audio_url: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="uploading")
    memory_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
