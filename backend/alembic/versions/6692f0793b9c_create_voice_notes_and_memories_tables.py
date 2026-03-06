"""create voice_notes and memories tables

Revision ID: 6692f0793b9c
Revises:
Create Date: 2026-03-05 07:12:37.258362

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6692f0793b9c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'voice_notes',
        sa.Column('id', sa.String(32), primary_key=True),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('audio_url', sa.String(512), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(100), nullable=False),
        sa.Column('duration_seconds', sa.Float(), server_default='0.0'),
        sa.Column('transcript', sa.Text(), nullable=True),
        sa.Column('language', sa.String(10), nullable=True),
        sa.Column('status', sa.String(20), server_default='uploading'),
        sa.Column('memory_id', sa.String(32), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        'memories',
        sa.Column('id', sa.String(32), primary_key=True),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('transcript', sa.Text(), nullable=False, server_default=''),
        sa.Column('tags', sa.JSON(), server_default='[]'),
        sa.Column('action_items', sa.JSON(), server_default='[]'),
        sa.Column('audio_url', sa.String(512), nullable=True),
        sa.Column('status', sa.String(20), server_default='processed'),
        sa.Column('voice_note_id', sa.String(32), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_index('ix_memories_type', 'memories', ['type'])
    op.create_index('ix_memories_status', 'memories', ['status'])


def downgrade() -> None:
    op.drop_index('ix_memories_status', table_name='memories')
    op.drop_index('ix_memories_type', table_name='memories')
    op.drop_table('memories')
    op.drop_table('voice_notes')
