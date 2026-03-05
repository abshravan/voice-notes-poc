"""Database CRUD operations for voice notes and memories."""

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.voice_note import VoiceNote
from app.models.memory import Memory


# ── Voice Notes ──────────────────────────────────────────

async def create_voice_note(db: AsyncSession, **kwargs) -> VoiceNote:
    vn = VoiceNote(**kwargs)
    db.add(vn)
    await db.flush()
    return vn


async def get_voice_note(db: AsyncSession, voice_note_id: str) -> VoiceNote | None:
    return await db.get(VoiceNote, voice_note_id)


async def update_voice_note(db: AsyncSession, voice_note_id: str, **kwargs) -> VoiceNote | None:
    vn = await db.get(VoiceNote, voice_note_id)
    if not vn:
        return None
    for key, value in kwargs.items():
        setattr(vn, key, value)
    await db.flush()
    return vn


# ── Memories ─────────────────────────────────────────────

async def create_memory(db: AsyncSession, **kwargs) -> Memory:
    mem = Memory(**kwargs)
    db.add(mem)
    await db.flush()
    return mem


async def get_memory(db: AsyncSession, memory_id: str) -> Memory | None:
    return await db.get(Memory, memory_id)


async def list_memories(
    db: AsyncSession,
    memory_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Memory]:
    stmt = select(Memory).order_by(desc(Memory.created_at))
    if memory_type:
        stmt = stmt.where(Memory.type == memory_type)
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_memory(db: AsyncSession, memory_id: str, **kwargs) -> Memory | None:
    mem = await db.get(Memory, memory_id)
    if not mem:
        return None
    for key, value in kwargs.items():
        setattr(mem, key, value)
    await db.flush()
    return mem


async def delete_memory(db: AsyncSession, memory_id: str) -> bool:
    mem = await db.get(Memory, memory_id)
    if not mem:
        return False
    await db.delete(mem)
    await db.flush()
    return True
