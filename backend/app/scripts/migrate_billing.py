"""One-off SQLite migration: GST billing tables & columns.

Adds the following to an existing SQLite database:
  * New columns on ``vendors``: gstin, pan, state, state_code, signature_url,
    registered_business_name. (``business_address`` already exists on the
    vendor model — we skip it if present, add it if missing.)
  * New tables: ``invoices``, ``invoice_line_items``, ``billing_addresses``.
  * Ensures the ``app/data/india_states.json`` mapping file is in place.

Idempotent: column existence is checked via ``PRAGMA table_info`` before
each ALTER, and tables are created with ``CREATE TABLE IF NOT EXISTS``
semantics via SQLAlchemy's ``Base.metadata.create_all``.

Run via::

    cd backend
    python3.13 -m app.scripts.migrate_billing
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from sqlalchemy import create_engine

from app.core.config import settings
from app.core.database import Base

# Importing models registers them on ``Base.metadata``. Keep these imports;
# they are required even though the names are not used directly here.
from app.models import (  # noqa: F401
    BillingAddress,
    Invoice,
    InvoiceLineItem,
    Vendor,
)


# Columns to add to the ``vendors`` table (name -> full column DDL fragment).
VENDOR_BILLING_COLUMNS: list[tuple[str, str]] = [
    ("gstin", "gstin VARCHAR(15)"),
    ("pan", "pan VARCHAR(10)"),
    ("business_address", "business_address TEXT"),
    ("state", "state VARCHAR(64)"),
    ("state_code", "state_code VARCHAR(2)"),
    ("signature_url", "signature_url VARCHAR"),
    ("registered_business_name", "registered_business_name VARCHAR(255)"),
]


def _sqlite_path_from_url(url: str) -> str:
    """Extract filesystem path from a SQLAlchemy SQLite URL.

    Supports both ``sqlite:///./x.db`` and ``sqlite+aiosqlite:///./x.db``.
    """
    # Strip scheme up to the first '///'
    if "///" not in url:
        raise RuntimeError(f"Unsupported SQLite URL: {url}")
    path = url.split("///", 1)[1]
    if not path:
        raise RuntimeError(f"Empty SQLite path in URL: {url}")
    return path


def _sync_engine_url(url: str) -> str:
    """Return a synchronous SQLAlchemy URL derived from the configured one."""
    return url.replace("sqlite+aiosqlite://", "sqlite://")


def _add_vendor_columns(db_path: str) -> None:
    """Idempotently add GST billing columns to the vendors table."""
    if not Path(db_path).exists():
        print(f"[vendors] DB not found at {db_path} — skipping column additions "
              "(init_db will create the table fresh with all columns).")
        return

    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()

        # Check vendors table exists.
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='vendors'"
        )
        if cur.fetchone() is None:
            print("[vendors] 'vendors' table does not exist yet — skipping "
                  "(will be created by init_db with all columns).")
            return

        cur.execute("PRAGMA table_info(vendors)")
        existing = {row[1] for row in cur.fetchall()}

        added = 0
        for col_name, ddl in VENDOR_BILLING_COLUMNS:
            if col_name in existing:
                print(f"[vendors] column '{col_name}' already exists, skipping.")
                continue
            stmt = f"ALTER TABLE vendors ADD COLUMN {ddl}"
            try:
                cur.execute(stmt)
                added += 1
                print(f"[vendors] added column: {col_name}")
            except sqlite3.OperationalError as e:
                print(f"[vendors] failed to add '{col_name}': {e}")

        # Index on gstin for faster lookup (declared index=True in the model).
        try:
            cur.execute(
                "CREATE INDEX IF NOT EXISTS ix_vendors_gstin ON vendors (gstin)"
            )
        except sqlite3.OperationalError as e:
            print(f"[vendors] index creation skipped: {e}")

        conn.commit()
        print(f"[vendors] done ({added} column(s) added).")
    finally:
        conn.close()


def _create_billing_tables(sync_url: str) -> None:
    """Create new tables (invoices, invoice_line_items, billing_addresses)."""
    engine = create_engine(sync_url)
    try:
        # Only create the three billing-specific tables so we don't try to
        # re-create every model table in the metadata.
        target_tables = [
            Base.metadata.tables["invoices"],
            Base.metadata.tables["invoice_line_items"],
            Base.metadata.tables["billing_addresses"],
        ]
        Base.metadata.create_all(bind=engine, tables=target_tables)
        for t in target_tables:
            print(f"[tables] ensured: {t.name}")
    finally:
        engine.dispose()


def _ensure_states_json() -> None:
    """Verify the India states mapping JSON exists (created alongside this script)."""
    path = Path(__file__).resolve().parent.parent / "data" / "india_states.json"
    if not path.exists():
        raise FileNotFoundError(
            f"Expected India states mapping at {path}. "
            "This file is shipped with the migration — please restore it."
        )
    with path.open("r", encoding="utf-8") as fh:
        mapping = json.load(fh)
    print(f"[data] india_states.json OK ({len(mapping)} states/UTs).")


def main() -> None:
    url = settings.DATABASE_URL
    sync_url = _sync_engine_url(url)

    print(f"[migrate_billing] DATABASE_URL={url}")

    if "sqlite" in url:
        db_path = _sqlite_path_from_url(sync_url)
        # Make relative paths absolute relative to the backend/ dir where the
        # server is normally launched from.
        if not Path(db_path).is_absolute():
            # The config BASE_DIR points at the backend/ folder.
            from app.core.config import BASE_DIR

            db_path = str((BASE_DIR / db_path).resolve())
        print(f"[migrate_billing] SQLite file: {db_path}")
        _add_vendor_columns(db_path)
    else:
        print("[migrate_billing] Non-SQLite DB detected — skipping raw ALTER step. "
              "Use Alembic for production migrations.")

    _create_billing_tables(sync_url)
    _ensure_states_json()
    print("[migrate_billing] complete.")


if __name__ == "__main__":
    main()
