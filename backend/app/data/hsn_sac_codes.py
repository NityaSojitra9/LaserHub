"""HSN (Harmonized System of Nomenclature) / SAC (Services Accounting Code) reference
library used for GST classification on LaserHub invoices.

SAC codes (services) are used for laser cutting, engraving and related services.
HSN codes (goods) are included for informational/reference only — they apply when
an invoice contains raw material resale (acrylic sheet, MDF, metal stock, etc.).

GST rates here are the default Indian GST rates as of FY 2024-25. Individual
invoices can override these per line-item if needed.
"""
from __future__ import annotations

from decimal import Decimal
from typing import Dict, Any


HSN_SAC_CODES: Dict[str, Dict[str, Any]] = {
    # ---- Services (SAC) ----
    "9987": {
        "description": "Maintenance, repair and installation services",
        "gst_rate": Decimal("18.00"),
        "category": "service",
    },
    "998877": {
        "description": (
            "Other manufacturing services — machining, cutting, engraving, "
            "laser cutting of metal / acrylic / wood"
        ),
        "gst_rate": Decimal("18.00"),
        "category": "service",
    },
    "9988": {
        "description": "Manufacturing services on physical inputs (goods) owned by others",
        "gst_rate": Decimal("18.00"),
        "category": "service",
    },
    "998873": {
        "description": "Other fabricated metal product manufacturing services",
        "gst_rate": Decimal("18.00"),
        "category": "service",
    },
    "998892": {
        "description": "Moulding, pressing, stamping, extruding and similar plastic manufacturing services",
        "gst_rate": Decimal("18.00"),
        "category": "service",
    },
    "996812": {
        "description": "Courier / local delivery services",
        "gst_rate": Decimal("18.00"),
        "category": "service",
    },

    # ---- Goods (HSN) — reference only when re-selling raw material ----
    "39201019": {
        "description": "Plates, sheets, film of acrylic (for reference only — goods HSN)",
        "gst_rate": Decimal("18.00"),
        "category": "goods",
    },
    "44111300": {
        "description": "Medium density fibreboard (MDF) sheets",
        "gst_rate": Decimal("18.00"),
        "category": "goods",
    },
    "72083990": {
        "description": "Flat-rolled steel sheet (mild steel / stainless)",
        "gst_rate": Decimal("18.00"),
        "category": "goods",
    },
    "76061190": {
        "description": "Aluminium plates / sheets (thickness > 0.2mm)",
        "gst_rate": Decimal("18.00"),
        "category": "goods",
    },
    "41071900": {
        "description": "Leather — further prepared",
        "gst_rate": Decimal("12.00"),
        "category": "goods",
    },
    "48025690": {
        "description": "Cardstock / uncoated paper",
        "gst_rate": Decimal("12.00"),
        "category": "goods",
    },
    "44123190": {
        "description": "Plywood with outer ply of tropical wood",
        "gst_rate": Decimal("18.00"),
        "category": "goods",
    },
}


# Default SAC code for laser cutting services on LaserHub.
DEFAULT_SAC_CODE = "9987"

# Default GST rate if no HSN/SAC match found.
DEFAULT_GST_RATE = Decimal("18.00")


def get_gst_rate(hsn_sac: str) -> Decimal:
    """Return the GST rate associated with the given HSN/SAC code.

    Falls back to ``DEFAULT_GST_RATE`` (18%) when the code is unknown.
    """
    if not hsn_sac:
        return DEFAULT_GST_RATE
    entry = HSN_SAC_CODES.get(str(hsn_sac).strip())
    if not entry:
        return DEFAULT_GST_RATE
    rate = entry.get("gst_rate", DEFAULT_GST_RATE)
    if not isinstance(rate, Decimal):
        rate = Decimal(str(rate))
    return rate


def get_description(hsn_sac: str) -> str:
    """Return the human-readable description for the given HSN/SAC code."""
    entry = HSN_SAC_CODES.get(str(hsn_sac).strip()) if hsn_sac else None
    if not entry:
        return ""
    return str(entry.get("description", ""))


def is_service(hsn_sac: str) -> bool:
    """True if the code corresponds to a service (SAC), False otherwise."""
    entry = HSN_SAC_CODES.get(str(hsn_sac).strip()) if hsn_sac else None
    if not entry:
        # Unknown codes default to "service" since LaserHub is primarily services.
        return True
    return entry.get("category") == "service"


__all__ = [
    "HSN_SAC_CODES",
    "DEFAULT_SAC_CODE",
    "DEFAULT_GST_RATE",
    "get_gst_rate",
    "get_description",
    "is_service",
]
