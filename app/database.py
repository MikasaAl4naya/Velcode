from collections.abc import AsyncGenerator

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_models() -> None:
    """Создаёт таблицы, если их ещё нет. Для прод-раскатки лучше Alembic-миграции."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def _migrate(connection):
            try:
                connection.execute(sa.text("ALTER TABLE ai_settings ADD COLUMN fast_responses_json TEXT DEFAULT '[]'"))
            except Exception:
                pass
            try:
                connection.execute(sa.text("ALTER TABLE ai_settings ADD COLUMN faq_threshold FLOAT DEFAULT 0.9"))
            except Exception:
                pass

        await conn.run_sync(_migrate)
