"""GST tax calculation helpers for LaserHub invoicing.

Rules implemented:
- Default GST rate for laser cutting services = 18% (SAC 9987).
- Intra-state (seller_state == buyer_state): split into CGST 9% + SGST 9%.
- Inter-state (seller_state != buyer_state): single IGST 18%.
- All monetary amounts are rounded half-up to 2 decimal places (INR paise).
- State codes are the official 2-digit Indian GST codes (see
  ``backend/app/data/india_states.json``).

The functions here are pure / stateless — they don't touch the database. They
are used by the invoice generator (``app.api.invoices``) and by the cost
preview endpoint to show tax breakdown prior to checkout.
"""
from __future__ import annotations

import json
import os
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Dict, Any


# ---------------------------------------------------------------------------
# State-code lookup
# ---------------------------------------------------------------------------

_STATES_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "india_states.json"
)


def _load_state_map() -> Dict[str, str]:
    try:
        with open(_STATES_JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


# Canonical map: { "Karnataka": "29", ... }
_STATE_MAP: Dict[str, str] = _load_state_map()

# Lowercase lookup: { "karnataka": "29", ... } for robust matching.
_STATE_LOOKUP: Dict[str, str] = {
    name.lower().strip(): code for name, code in _STATE_MAP.items()
}

# Reverse map: { "29": "Karnataka", ... }
_CODE_TO_NAME: Dict[str, str] = {code: name for name, code in _STATE_MAP.items()}


# ---------------------------------------------------------------------------
# Rounding helpers
# ---------------------------------------------------------------------------

TWO_PLACES = Decimal("0.01")


def round_inr(amount: Decimal | float | int | str) -> Decimal:
    """Round to 2 decimal places, half-up — standard Indian invoice rounding."""
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    return amount.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def _to_decimal(x: Decimal | float | int | str) -> Decimal:
    if isinstance(x, Decimal):
        return x
    return Decimal(str(x))


# ---------------------------------------------------------------------------
# State helpers
# ---------------------------------------------------------------------------

def state_code_from_name(name: Optional[str]) -> str:
    """Look up Indian state's 2-digit GST code from its name.

    Returns an empty string if the name is not recognised. Matching is
    case-insensitive and tolerant of surrounding whitespace.
    """
    if not name:
        return ""
    key = str(name).lower().strip()
    return _STATE_LOOKUP.get(key, "")


def state_name_from_code(code: Optional[str]) -> str:
    """Reverse lookup — returns the canonical state name for a 2-digit code.

    Returns an empty string when the code is unknown.
    """
    if not code:
        return ""
    return _CODE_TO_NAME.get(str(code).strip().zfill(2), "")


def normalise_state_code(code: Optional[str]) -> str:
    """Return a zero-padded 2-char state code or empty string."""
    if code is None:
        return ""
    s = str(code).strip()
    if not s:
        return ""
    # Accept integers ("7" -> "07") as well as full codes.
    if s.isdigit():
        return s.zfill(2)
    return s


def determine_place_of_supply(
    buyer_state_code: Optional[str],
    shipping_state_code: Optional[str],
    seller_state_code: str,
) -> str:
    """Return the state code where the supply is made (place of supply / POS).

    Per Indian GST rules the place of supply defaults to the ship-to location
    when goods / services are delivered to the customer; when that's unknown
    we fall back to the buyer's registered billing state; if that's also
    missing we assume the seller's own state (treated as intra-state).
    """
    for candidate in (shipping_state_code, buyer_state_code, seller_state_code):
        code = normalise_state_code(candidate)
        if code:
            return code
    return ""


# ---------------------------------------------------------------------------
# Core GST calculator
# ---------------------------------------------------------------------------

def calculate_gst(
    amount: Decimal | float | int | str,
    seller_state_code: str,
    buyer_state_code: str,
    gst_rate: Decimal | float | int | str = Decimal("18.00"),
) -> Dict[str, Any]:
    """Compute the GST breakdown for ``amount`` at ``gst_rate``.

    Args:
        amount: Taxable value (pre-tax) in INR.
        seller_state_code: 2-digit GST code of the seller / supplier.
        buyer_state_code: 2-digit GST code of the buyer (place of supply).
        gst_rate: Total GST rate in percent, e.g. ``Decimal("18.00")``.

    Returns a dict with keys:
        - ``taxable_value``: the input amount, rounded to 2 dp.
        - ``cgst_rate`` / ``cgst_amount``
        - ``sgst_rate`` / ``sgst_amount``
        - ``igst_rate`` / ``igst_amount``
        - ``total_tax``: cgst + sgst + igst
        - ``is_interstate``: bool
        - ``gst_rate``: effective total GST rate applied

    For intra-state supplies: CGST and SGST each = gst_rate / 2, IGST = 0.
    For inter-state supplies: IGST = gst_rate, CGST = SGST = 0.
    """
    amount_d = _to_decimal(amount)
    rate_d = _to_decimal(gst_rate)

    seller_code = normalise_state_code(seller_state_code)
    buyer_code = normalise_state_code(buyer_state_code)

    # If the buyer's state is unknown we cannot declare inter-state supply.
    # Per the GST rules the seller's state is assumed (intra-state) for B2C
    # previews; this mirrors the frontend default.
    if not buyer_code:
        buyer_code = seller_code

    is_interstate = bool(seller_code) and bool(buyer_code) and seller_code != buyer_code

    taxable_value = round_inr(amount_d)

    if is_interstate:
        igst_rate = rate_d
        igst_amount = round_inr(amount_d * rate_d / Decimal("100"))
        cgst_rate = Decimal("0.00")
        sgst_rate = Decimal("0.00")
        cgst_amount = Decimal("0.00")
        sgst_amount = Decimal("0.00")
    else:
        half_rate = (rate_d / Decimal("2")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        cgst_rate = half_rate
        sgst_rate = half_rate
        cgst_amount = round_inr(amount_d * half_rate / Decimal("100"))
        sgst_amount = round_inr(amount_d * half_rate / Decimal("100"))
        igst_rate = Decimal("0.00")
        igst_amount = Decimal("0.00")

    total_tax = round_inr(cgst_amount + sgst_amount + igst_amount)

    return {
        "taxable_value": taxable_value,
        "cgst_rate": cgst_rate,
        "cgst_amount": cgst_amount,
        "sgst_rate": sgst_rate,
        "sgst_amount": sgst_amount,
        "igst_rate": igst_rate,
        "igst_amount": igst_amount,
        "total_tax": total_tax,
        "is_interstate": is_interstate,
        "gst_rate": rate_d,
    }


# ---------------------------------------------------------------------------
# GSTIN validation
# ---------------------------------------------------------------------------

import re

_GSTIN_REGEX = re.compile(
    r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
)


def is_valid_gstin(gstin: Optional[str]) -> bool:
    """Loose structural validation of a GSTIN.

    A GSTIN is 15 characters: first 2 digits = state code, next 10 = PAN,
    13th = entity-number, 14th = 'Z' (fixed), 15th = checksum. We do not
    verify the checksum (which requires mod 36 maths); we just verify the
    shape so typos are caught client-side.
    """
    if not gstin:
        return False
    return bool(_GSTIN_REGEX.match(str(gstin).upper().strip()))


def state_code_from_gstin(gstin: Optional[str]) -> str:
    """Extract the 2-digit state code prefix from a GSTIN, or '' if invalid."""
    if not gstin or len(str(gstin).strip()) < 2:
        return ""
    prefix = str(gstin).strip()[:2]
    return prefix if prefix.isdigit() else ""


__all__ = [
    "calculate_gst",
    "round_inr",
    "state_code_from_name",
    "state_name_from_code",
    "normalise_state_code",
    "determine_place_of_supply",
    "is_valid_gstin",
    "state_code_from_gstin",
]
