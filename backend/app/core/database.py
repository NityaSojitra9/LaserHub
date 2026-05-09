"""
Database configuration and session management
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

logger = logging.getLogger(__name__)


# Optimized database engine with connection pooling
engine_kwargs = {
    "echo": False,
}

if "sqlite" in settings.DATABASE_URL:
    # SQLite doesn't support connection pooling
    from sqlalchemy.pool import StaticPool
    engine_kwargs["poolclass"] = StaticPool
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all models"""
    pass


async def get_db() -> AsyncSession:
    """Dependency for getting database session.

    Note on commit behavior: This generator commits after yield as a safety net.
    Many API endpoints already call ``await db.commit()`` explicitly within the
    endpoint body.  The second commit here is a no-op in that case (SQLAlchemy
    treats committing a session with no pending changes as harmless).  This
    pattern ensures that if an endpoint forgets to commit, changes are still
    persisted.  However, endpoints should still commit explicitly for clarity
    and to control exactly when writes are flushed.
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Lightweight additive migrations for columns added after initial deploy.
    # For SQLite (dev), we can add columns idempotently via ALTER TABLE.
    from sqlalchemy import text
    additive_migrations = [
        ("users", "addresses", "TEXT DEFAULT '[]'"),
        ("orders", "guest_tracking_token", "VARCHAR"),
        ("materials", "strength_rating", "INTEGER DEFAULT 3"),
        ("materials", "outdoor_safe", "BOOLEAN DEFAULT 0"),
        ("materials", "food_safe", "BOOLEAN DEFAULT 0"),
        ("materials", "burn_behavior", "VARCHAR DEFAULT ''"),
        ("materials", "finish_options", "VARCHAR DEFAULT ''"),
        ("materials", "best_use_cases", "TEXT DEFAULT '[]'"),
        ("materials", "max_thickness_mm", "FLOAT"),
    ]
    async with engine.begin() as conn:
        for table, column, coltype in additive_migrations:
            try:
                await conn.execute(
                    text(f"ALTER TABLE {table} ADD COLUMN {column} {coltype}")
                )
            except Exception:
                # Column already exists or table missing — safe to ignore.
                pass

    # Vendor contact/GMB columns — idempotent, SQLite + Postgres safe.
    await _ensure_vendor_columns()


# Column name -> DDL fragment (column name + type, no "ADD COLUMN")
VENDOR_NEW_COLUMNS: list[tuple[str, str]] = [
    ("phone_country_code", "phone_country_code VARCHAR(8)"),
    ("phone_number", "phone_number VARCHAR(32)"),
    ("business_email", "business_email VARCHAR(255)"),
    ("business_address", "business_address TEXT"),
    ("gst_number", "gst_number VARCHAR(32)"),
    ("gst_certificate_url", "gst_certificate_url VARCHAR(512)"),
    ("storefront_image_url", "storefront_image_url VARCHAR(512)"),
    ("gmb_place_id", "gmb_place_id VARCHAR(128)"),
    ("gmb_name", "gmb_name VARCHAR(255)"),
    ("gmb_phone", "gmb_phone VARCHAR(64)"),
    ("gmb_address", "gmb_address TEXT"),
    ("gmb_website", "gmb_website VARCHAR(512)"),
    ("gmb_rating", "gmb_rating FLOAT"),
    ("gmb_review_count", "gmb_review_count INTEGER"),
    ("gmb_maps_url", "gmb_maps_url VARCHAR(512)"),
    ("gmb_last_synced", "gmb_last_synced DATETIME"),
]


async def _ensure_vendor_columns() -> None:
    """Idempotently add new vendor columns. Works on SQLite and Postgres."""
    from sqlalchemy import text
    is_sqlite = "sqlite" in settings.DATABASE_URL
    async with engine.begin() as conn:
        if is_sqlite:
            result = await conn.execute(text("PRAGMA table_info(vendors)"))
            existing = {row[1] for row in result.fetchall()}
        else:
            result = await conn.execute(
                text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name='vendors'"
                )
            )
            existing = {row[0] for row in result.fetchall()}

        # Postgres doesn't support DATETIME as a type name — translate.
        for col_name, ddl in VENDOR_NEW_COLUMNS:
            if col_name in existing:
                continue
            ddl_sql = ddl
            if not is_sqlite:
                ddl_sql = ddl_sql.replace(" DATETIME", " TIMESTAMP")
            try:
                await conn.execute(text(f"ALTER TABLE vendors ADD COLUMN {ddl_sql}"))
            except Exception as e:
                logger.warning("vendor_migration.skip", extra={"col": col_name, "err": str(e)})

        # Ensure the gmb_place_id index exists (declared index=True in the model).
        try:
            await conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_vendors_gmb_place_id ON vendors (gmb_place_id)")
            )
        except Exception as e:
            logger.warning("vendor_migration.index_skip", extra={"err": str(e)})
