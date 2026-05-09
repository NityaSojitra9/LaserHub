"""
Seed comparison/wizard metadata onto existing materials.
Run: python3.13 -m app.scripts.seed_material_props
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models import Material


# Keyed by material name substring (case-insensitive)
PROPS = {
    "acrylic (clear)": {
        "strength_rating": 3,
        "outdoor_safe": True,
        "food_safe": False,
        "burn_behavior": "clean-cut, flame-polished edge",
        "finish_options": "glossy, matte",
        "best_use_cases": ["signage", "displays", "light guides", "decoration"],
        "max_thickness_mm": 10.0,
    },
    "acrylic (black)": {
        "strength_rating": 3,
        "outdoor_safe": True,
        "food_safe": False,
        "burn_behavior": "clean-cut, flame-polished edge",
        "finish_options": "glossy, matte",
        "best_use_cases": ["signage", "jewelry", "enclosures", "decoration"],
        "max_thickness_mm": 6.0,
    },
    "mdf": {
        "strength_rating": 3,
        "outdoor_safe": False,
        "food_safe": False,
        "burn_behavior": "charred edges, can be sanded",
        "finish_options": "natural, paintable",
        "best_use_cases": ["prototype", "enclosure", "decoration", "signage"],
        "max_thickness_mm": 12.0,
    },
    "plywood": {
        "strength_rating": 4,
        "outdoor_safe": False,
        "food_safe": False,
        "burn_behavior": "light char, clean grain",
        "finish_options": "natural wood, stain, paint",
        "best_use_cases": ["enclosure", "decoration", "furniture", "prototype"],
        "max_thickness_mm": 18.0,
    },
    "leather": {
        "strength_rating": 2,
        "outdoor_safe": True,
        "food_safe": False,
        "burn_behavior": "dark cauterised edge, mild smoke",
        "finish_options": "natural",
        "best_use_cases": ["jewelry", "wallets", "accessories", "decoration"],
        "max_thickness_mm": 3.0,
    },
    "cardstock": {
        "strength_rating": 1,
        "outdoor_safe": False,
        "food_safe": True,
        "burn_behavior": "clean cut, slight browning",
        "finish_options": "matte, glossy, coloured",
        "best_use_cases": ["invitations", "packaging", "prototypes", "models"],
        "max_thickness_mm": 0.5,
    },
    "aluminum": {
        "strength_rating": 5,
        "outdoor_safe": True,
        "food_safe": True,
        "burn_behavior": "requires fiber laser, mark or light cut only",
        "finish_options": "brushed, anodised, natural",
        "best_use_cases": ["signage", "enclosure", "industrial parts"],
        "max_thickness_mm": 2.0,
    },
    "stainless": {
        "strength_rating": 5,
        "outdoor_safe": True,
        "food_safe": True,
        "burn_behavior": "requires fiber laser, oxidation edge",
        "finish_options": "brushed, mirror, natural",
        "best_use_cases": ["jewelry", "signage", "industrial parts", "cookware"],
        "max_thickness_mm": 1.0,
    },
}


async def seed():
    if settings.ENVIRONMENT.lower() != "development":
        raise SystemExit(
            f"Seed scripts are development-only. Current ENVIRONMENT={settings.ENVIRONMENT}. "
            "Set ENVIRONMENT=development to run."
        )

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    Session = async_sessionmaker(engine, class_=AsyncSession)

    async with Session() as session:  # type: AsyncSession
        result = await session.execute(select(Material))
        materials = result.scalars().all()

        updated = 0
        for m in materials:
            name_lower = (m.name or "").lower()
            props = None
            for key, value in PROPS.items():
                if key in name_lower:
                    props = value
                    break
            if not props:
                continue

            m.strength_rating = props["strength_rating"]
            m.outdoor_safe = props["outdoor_safe"]
            m.food_safe = props["food_safe"]
            m.burn_behavior = props["burn_behavior"]
            m.finish_options = props["finish_options"]
            m.best_use_cases = json.dumps(props["best_use_cases"])
            m.max_thickness_mm = props["max_thickness_mm"]
            updated += 1
            print(f"Updated {m.name}")

        await session.commit()
        print(f"\nDone. Updated {updated} / {len(materials)} materials.")


# Alias so this script can be invoked as `seed_material_props.main()` per the
# repo-wide seed-script convention (SEED-01).
main = seed


if __name__ == "__main__":
    asyncio.run(main())
