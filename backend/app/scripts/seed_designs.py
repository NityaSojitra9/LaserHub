"""
Seed featured designs with real SVG files
Run with: cd backend && python3.13 -m app.scripts.seed_designs
"""
import asyncio
import json
import os
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base
from app.models import User, UploadedFile, Design, DesignListing, Vendor, Material
from app.utils.file_parser import parse_generic

DESIGNS_DIR = Path(__file__).parent.parent / "static" / "designs"

# Canonical design definitions — one per SVG file
DESIGN_CATALOG = [
    {
        "filename": "geometric_clock.svg",
        "title": "Geometric Wall Clock",
        "description": (
            "Modern minimalist wall clock with geometric star cutouts. "
            "Fits any standard AA/AA clock mechanism (14mm shaft). "
            "200×200mm, laser-ready vector."
        ),
        "category": "home_decor",
        "tags": json.dumps(["clock", "geometric", "wall decor", "minimalist", "home"]),
        "likes_count": 234,
        "downloads_count": 89,
        "is_featured": True,
    },
    {
        "filename": "mandala_earrings.svg",
        "title": "Mandala Circle Earrings",
        "description": (
            "Pair of mandala-style circle earrings with concentric ring and spoke pattern. "
            "Includes 1.5mm hook holes. Clean cut paths, no fill — pure vector."
        ),
        "category": "jewelry",
        "tags": json.dumps(["earrings", "mandala", "jewelry", "circle", "laser cut"]),
        "likes_count": 312,
        "downloads_count": 201,
        "is_featured": True,
    },
    {
        "filename": "honeycomb_shelf_bracket.svg",
        "title": "Honeycomb Shelf Brackets",
        "description": (
            "Decorative L-shaped shelf brackets with honeycomb cutout pattern. "
            "180×120mm per bracket. Includes mounting holes. "
            "Best in 6mm plywood or acrylic."
        ),
        "category": "home_decor",
        "tags": json.dumps(["shelf", "bracket", "honeycomb", "hexagon", "furniture", "home"]),
        "likes_count": 145,
        "downloads_count": 67,
        "is_featured": False,
    },
    {
        "filename": "city_skyline_art.svg",
        "title": "City Skyline Wall Art",
        "description": (
            "Multi-layer night cityscape with moon, skyscrapers, and window details. "
            "300×150mm framed panel — creates stunning shadow effects when backlit."
        ),
        "category": "art",
        "tags": json.dumps(["skyline", "city", "wall art", "architecture", "night"]),
        "likes_count": 276,
        "downloads_count": 134,
        "is_featured": True,
    },
    {
        "filename": "gear_set_mechanical.svg",
        "title": "Interlocking Gear Set",
        "description": (
            "3-piece interlocking gear set for kinetic art or STEM displays. "
            "Includes one large (92mm) and two smaller gears. "
            "Axle holes sized for 6mm dowel rods."
        ),
        "category": "mechanical",
        "tags": json.dumps(["gears", "mechanical", "kinetic", "STEM", "engineering"]),
        "likes_count": 98,
        "downloads_count": 45,
        "is_featured": False,
    },
    {
        "filename": "name_sign_template.svg",
        "title": "Custom Name Sign",
        "description": (
            "Elegant name-sign template with decorative border, star flourishes, "
            "and side mounting holes. 280×80mm. Edit the text area in Inkscape or Illustrator."
        ),
        "category": "signage",
        "tags": json.dumps(["sign", "name", "signage", "personalized", "custom", "text"]),
        "likes_count": 189,
        "downloads_count": 156,
        "is_featured": True,
    },
    {
        "filename": "phone_stand.svg",
        "title": "Minimalist Phone Stand",
        "description": (
            "Sleek phone stand with cable management slot and decorative cutouts. "
            "Fits all phone sizes. 200×160mm, 3–6mm material thickness recommended."
        ),
        "category": "other",
        "tags": json.dumps(["phone stand", "desk", "organizer", "minimalist", "cable management"]),
        "likes_count": 201,
        "downloads_count": 178,
        "is_featured": True,
    },
    {
        "filename": "geometric_pendant.svg",
        "title": "Diamond Geometric Pendant",
        "description": (
            "Elegant layered diamond pendant with nested shapes and star center. "
            "80×100mm with bail loop included. Perfect in 3mm acrylic or wood."
        ),
        "category": "jewelry",
        "tags": json.dumps(["pendant", "necklace", "diamond", "geometric", "jewelry"]),
        "likes_count": 167,
        "downloads_count": 98,
        "is_featured": False,
    },
    {
        "filename": "puzzle_box.svg",
        "title": "Finger-Joint Puzzle Box",
        "description": (
            "Interlocking finger-joint box with sliding lid and decorative panels. "
            "Complete flat-pack template — all panels included in one sheet. "
            "6mm MDF or plywood."
        ),
        "category": "educational",
        "tags": json.dumps(["box", "puzzle", "finger joint", "STEM", "storage", "flat pack"]),
        "likes_count": 143,
        "downloads_count": 87,
        "is_featured": False,
    },
    {
        "filename": "decorative_panel.svg",
        "title": "Rosette Decorative Panel",
        "description": (
            "200×200mm decorative wall panel with 16-petal rosette, concentric rings, "
            "corner ornaments, and mounting holes. Stunning as a standalone piece or tiled."
        ),
        "category": "art",
        "tags": json.dumps(["rosette", "decorative", "panel", "floral", "mandala", "wall art"]),
        "likes_count": 256,
        "downloads_count": 112,
        "is_featured": True,
    },
    {
        "filename": "stencil_alphabet.svg",
        "title": "Stencil Alphabet Template",
        "description": (
            "Laser-cut stencil with registration marks and stencil bridges. "
            "300×120mm. Sample letters A, B, C, E, R, S with proper stencil gaps "
            "so letters remain attached to the sheet."
        ),
        "category": "stencils",
        "tags": json.dumps(["stencil", "alphabet", "letters", "sign painting", "template"]),
        "likes_count": 88,
        "downloads_count": 210,
        "is_featured": False,
    },
]

# Listing price configuration: design_filename -> list of (material_name, thickness_mm, price)
LISTING_CONFIGS = {
    "geometric_clock.svg": [
        ("Acrylic (Clear)", 3, 18.50),
        ("MDF Wood", 6, 12.75),
        ("Baltic Birch Plywood", 6, 14.00),
    ],
    "mandala_earrings.svg": [
        ("Acrylic (Clear)", 3, 8.99),
        ("Genuine Leather", 2, 11.50),
    ],
    "honeycomb_shelf_bracket.svg": [
        ("Baltic Birch Plywood", 6, 22.00),
        ("MDF Wood", 6, 16.50),
    ],
    "city_skyline_art.svg": [
        ("MDF Wood", 3, 19.95),
        ("Baltic Birch Plywood", 3, 24.00),
        ("Acrylic (Black)", 3, 28.50),
    ],
    "gear_set_mechanical.svg": [
        ("Acrylic (Clear)", 5, 15.00),
        ("Baltic Birch Plywood", 6, 12.00),
    ],
    "name_sign_template.svg": [
        ("Acrylic (Clear)", 3, 9.99),
        ("Baltic Birch Plywood", 3, 7.50),
        ("MDF Wood", 3, 5.99),
    ],
    "phone_stand.svg": [
        ("Baltic Birch Plywood", 6, 11.00),
        ("Acrylic (Clear)", 5, 14.50),
    ],
    "geometric_pendant.svg": [
        ("Acrylic (Clear)", 3, 7.50),
        ("Genuine Leather", 2, 9.00),
    ],
    "puzzle_box.svg": [
        ("MDF Wood", 6, 24.99),
        ("Baltic Birch Plywood", 6, 29.99),
    ],
    "decorative_panel.svg": [
        ("MDF Wood", 3, 16.00),
        ("Acrylic (Clear)", 3, 22.50),
        ("Baltic Birch Plywood", 3, 18.00),
    ],
    "stencil_alphabet.svg": [
        ("Acrylic (Clear)", 3, 12.00),
        ("Cardstock", 0.5, 4.99),
    ],
}


async def _get_or_create_uploaded_file(
    session: AsyncSession,
    svg_path: Path,
    creator_user_id: int,
) -> UploadedFile:
    """Parse an SVG and insert an UploadedFile row, returning it."""
    file_uuid = str(uuid.uuid4())
    file_size = svg_path.stat().st_size

    # Parse the SVG for real dimensions
    try:
        parsed = parse_generic(str(svg_path))
    except Exception as exc:
        print(f"    Warning: parse failed for {svg_path.name}: {exc}; using fallback values")
        parsed = {
            "width_mm": 100.0,
            "height_mm": 100.0,
            "area_cm2": 100.0,
            "cut_length_mm": 400.0,
        }

    uploaded_file = UploadedFile(
        file_id=file_uuid,
        filename=svg_path.name,
        file_path=str(svg_path),
        file_size=file_size,
        file_type="svg",
        width_mm=parsed.get("width_mm"),
        height_mm=parsed.get("height_mm"),
        area_cm2=parsed.get("area_cm2"),
        cut_length_mm=parsed.get("cut_length_mm"),
        estimated_cut_time_minutes=(parsed.get("cut_length_mm", 0) or 0) / 500.0,
    )
    session.add(uploaded_file)
    await session.flush()
    return uploaded_file


async def seed_designs():
    if settings.ENVIRONMENT.lower() != "development":
        raise SystemExit(
            f"Seed scripts are development-only. Current ENVIRONMENT={settings.ENVIRONMENT}. "
            "Set ENVIRONMENT=development to run."
        )

    engine = create_async_engine(settings.DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession)

    async with async_session() as session:
        # --- resolve prerequisite data ---

        # Creator user: prefer a vendor user, fall back to any user
        creator_result = await session.execute(
            User.__table__.select().where(User.role == "vendor").limit(1)
        )
        creator_row = creator_result.fetchone()
        if not creator_row:
            creator_result = await session.execute(User.__table__.select().limit(1))
            creator_row = creator_result.fetchone()

        if not creator_row:
            print("No users found. Run seed_data.py and seed_marketplace.py first!")
            return

        creator_id = creator_row.id
        print(f"  Using creator user id={creator_id} ({creator_row.email})")

        # Load all vendors
        vendors_result = await session.execute(
            Vendor.__table__.select().where(Vendor.is_active == True)
        )
        all_vendors = vendors_result.fetchall()
        if not all_vendors:
            print("  Warning: no vendors found — DesignListings will be skipped.")

        # Load materials by name for fast lookup
        materials_result = await session.execute(Material.__table__.select())
        materials_by_name = {row.name: row for row in materials_result.fetchall()}

        # --- seed each design ---
        designs_seeded = 0
        listings_seeded = 0

        for entry in DESIGN_CATALOG:
            filename = entry["filename"]
            svg_path = DESIGNS_DIR / filename

            if not svg_path.exists():
                print(f"  SKIP (file missing): {filename}")
                continue

            # Check if design already exists by title
            existing = await session.execute(
                Design.__table__.select().where(Design.title == entry["title"])
            )
            if existing.fetchone():
                print(f"  Skip (exists): {entry['title']}")
                continue

            # Create the UploadedFile record
            print(f"  Parsing: {filename} ...")
            uploaded_file = await _get_or_create_uploaded_file(session, svg_path, creator_id)

            # Thumbnail URL points to the static-served SVG
            thumbnail_url = f"/static/designs/{filename}"

            # Create the Design record
            design = Design(
                creator_id=creator_id,
                file_id=uploaded_file.id,
                title=entry["title"],
                description=entry["description"],
                category=entry["category"],
                tags=entry["tags"],
                thumbnail_url=thumbnail_url,
                is_public=True,
                is_featured=entry["is_featured"],
                likes_count=entry["likes_count"],
                downloads_count=entry["downloads_count"],
            )
            session.add(design)
            await session.flush()
            designs_seeded += 1
            print(f"  Created design: {design.title} (file_id={uploaded_file.id})")

            # Create DesignListing entries
            listing_configs = LISTING_CONFIGS.get(filename, [])
            for mat_name, thickness_mm, price in listing_configs:
                mat_row = materials_by_name.get(mat_name)
                if not mat_row:
                    print(f"    Skip listing: material '{mat_name}' not found in DB")
                    continue

                # Pick a vendor that carries this material/thickness
                vendor_row = None
                for v in all_vendors:
                    # Check if vendor carries this material
                    vm_check = await session.execute(
                        sa.text(
                            "SELECT id FROM vendor_materials "
                            "WHERE vendor_id=:vid AND material_id=:mid AND thickness_mm=:t"
                        ).bindparams(vid=v.id, mid=mat_row.id, t=thickness_mm)
                    )
                    if vm_check.fetchone():
                        vendor_row = v
                        break

                if not vendor_row and all_vendors:
                    vendor_row = all_vendors[0]  # fallback to first vendor

                if not vendor_row:
                    print(f"    Skip listing: no vendor available")
                    continue

                listing = DesignListing(
                    vendor_id=vendor_row.id,
                    design_id=design.id,
                    material_id=mat_row.id,
                    thickness_mm=thickness_mm,
                    price=price,
                    description=f"{mat_name} {thickness_mm}mm — ready to cut",
                    is_active=True,
                    sold_count=0,
                )
                session.add(listing)
                listings_seeded += 1

        await session.commit()
        print(f"\nDone! Seeded {designs_seeded} designs and {listings_seeded} listings.")


# Alias so this script can be invoked as `seed_designs.main()` per the
# repo-wide seed-script convention (SEED-01).
main = seed_designs


if __name__ == "__main__":
    print("Seeding LaserHub featured designs...")
    asyncio.run(main())
