"""
Saved addresses API — users can manage multiple shipping addresses.

Addresses are stored as a JSON list on the User row. Each entry:
{
  "id": str (uuid),
  "label": str,
  "street": str,
  "city": str,
  "state": str,
  "zip": str,
  "country": str,
  "is_default": bool
}
"""

import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models import User

router = APIRouter()


class AddressIn(BaseModel):
    label: Optional[str] = ""
    street: str
    city: str
    state: Optional[str] = ""
    zip: Optional[str] = ""
    country: Optional[str] = ""
    is_default: Optional[bool] = False


def _load_addresses(user: User) -> list[dict]:
    raw = user.addresses or "[]"
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
    except (json.JSONDecodeError, TypeError):
        pass
    return []


async def _save_addresses(user: User, addresses: list[dict], db: AsyncSession) -> None:
    user.addresses = json.dumps(addresses)
    await db.commit()


@router.get("/")
async def list_addresses(
    current_user: User = Depends(get_current_user),
):
    """Return the current user's saved addresses."""
    return {"addresses": _load_addresses(current_user)}


@router.post("/")
async def create_address(
    data: AddressIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new saved address."""
    addresses = _load_addresses(current_user)
    new_addr = {
        "id": str(uuid.uuid4()),
        "label": data.label or "",
        "street": data.street,
        "city": data.city,
        "state": data.state or "",
        "zip": data.zip or "",
        "country": data.country or "",
        "is_default": bool(data.is_default) or len(addresses) == 0,
    }
    if new_addr["is_default"]:
        for a in addresses:
            a["is_default"] = False
    addresses.append(new_addr)
    await _save_addresses(current_user, addresses, db)
    return new_addr


@router.put("/{address_id}")
async def update_address(
    address_id: str,
    data: AddressIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    addresses = _load_addresses(current_user)
    found = next((a for a in addresses if a.get("id") == address_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Address not found")
    found.update({
        "label": data.label or "",
        "street": data.street,
        "city": data.city,
        "state": data.state or "",
        "zip": data.zip or "",
        "country": data.country or "",
    })
    if data.is_default:
        for a in addresses:
            a["is_default"] = a["id"] == address_id
    await _save_addresses(current_user, addresses, db)
    return found


@router.delete("/{address_id}")
async def delete_address(
    address_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    addresses = _load_addresses(current_user)
    filtered = [a for a in addresses if a.get("id") != address_id]
    if len(filtered) == len(addresses):
        raise HTTPException(status_code=404, detail="Address not found")
    # If we removed the default, promote the first remaining to default
    if filtered and not any(a.get("is_default") for a in filtered):
        filtered[0]["is_default"] = True
    await _save_addresses(current_user, filtered, db)
    return {"status": "deleted"}


@router.put("/{address_id}/default")
async def set_default_address(
    address_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    addresses = _load_addresses(current_user)
    if not any(a.get("id") == address_id for a in addresses):
        raise HTTPException(status_code=404, detail="Address not found")
    for a in addresses:
        a["is_default"] = a.get("id") == address_id
    await _save_addresses(current_user, addresses, db)
    return {"status": "ok"}
