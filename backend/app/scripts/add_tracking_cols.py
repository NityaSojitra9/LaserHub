"""Idempotent migration: add tracking columns and order_events table.

Run once:
    cd backend && python3.13 -m app.scripts.add_tracking_cols
"""

import asyncio

from sqlalchemy import text

from app.core.database import Base, engine
from app.models import OrderEvent  # noqa: F401  -- ensure table registered


async def migrate() -> None:
    async with engine.begin() as conn:
        # New columns on orders
        for stmt in [
            "ALTER TABLE orders ADD COLUMN estimated_delivery_date DATETIME",
            "ALTER TABLE orders ADD COLUMN courier TEXT",
            "ALTER TABLE orders ADD COLUMN guest_tracking_token TEXT",
            # users.notification_prefs
            "ALTER TABLE users ADD COLUMN notification_prefs TEXT",
        ]:
            try:
                await conn.execute(text(stmt))
                print(f"OK: {stmt}")
            except Exception as e:
                print(f"Skip: {stmt} -> {e}")

        # Create order_events table if missing
        await conn.run_sync(Base.metadata.create_all)
        print("order_events table ensured")


if __name__ == "__main__":
    asyncio.run(migrate())
