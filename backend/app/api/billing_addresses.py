"""
Billing address CRUD endpoints (GSTIN-enabled billing addresses).
Separate from the simpler /api/addresses/ (shipping-only) endpoints.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import BillingAddress, User
from app.api.auth import get_current_user
from app.schemas import (
    BillingAddressCreate,
    BillingAddressResponse,
    BillingAddressUpdate,
)

router = APIRouter()


def _to_response(addr: BillingAddress) -> dict:
    """Convert ORM BillingAddress to a JSON-serialisable dict."""
    return {
        "id": addr.id,
        "user_id": addr.user_id,
        "label": addr.label,
        "name": addr.name,
        "gstin": addr.gstin,
        "address_line_1": addr.address_line_1,
        "address_line_2": addr.address_line_2,
        "city": addr.city,
        "state": addr.state,
        "state_code": addr.state_code,
        "postal_code": addr.postal_code,
        "country": addr.country,
        "phone": addr.phone,
        "email": addr.email,
        "is_default": bool(addr.is_default),
        "is_business": bool(addr.is_business),
        "created_at": addr.created_at.isoformat() if addr.created_at else None,
    }


@router.get("/", response_model=List[BillingAddressResponse])
async def list_billing_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List current user's billing addresses."""
    result = await db.execute(
        select(BillingAddress)
        .where(BillingAddress.user_id == current_user.id)
        .order_by(BillingAddress.is_default.desc(), BillingAddress.id.desc())
    )
    addresses = result.scalars().all()
    return [_to_response(a) for a in addresses]


@router.post("/", response_model=BillingAddressResponse, status_code=201)
async def create_billing_address(
    data: BillingAddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new billing address."""
    payload = data.model_dump(exclude_unset=True)
    # If this is the user's first address, force it to be default
    existing_result = await db.execute(
        select(BillingAddress).where(BillingAddress.user_id == current_user.id)
    )
    existing = existing_result.scalars().all()
    if not existing:
        payload["is_default"] = True

    # If marked as default, clear default on others
    if payload.get("is_default"):
        await db.execute(
            update(BillingAddress)
            .where(BillingAddress.user_id == current_user.id)
            .values(is_default=False)
        )

    # Set is_business flag based on GSTIN presence
    payload["is_business"] = bool(payload.get("gstin"))

    new_addr = BillingAddress(user_id=current_user.id, **payload)
    db.add(new_addr)
    await db.commit()
    await db.refresh(new_addr)
    return _to_response(new_addr)


@router.put("/{address_id}", response_model=BillingAddressResponse)
async def update_billing_address(
    address_id: int,
    data: BillingAddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a billing address."""
    result = await db.execute(
        select(BillingAddress).where(
            BillingAddress.id == address_id,
            BillingAddress.user_id == current_user.id,
        )
    )
    addr = result.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    payload = data.model_dump(exclude_unset=True)

    # If marked as default, clear others first
    if payload.get("is_default"):
        await db.execute(
            update(BillingAddress)
            .where(
                BillingAddress.user_id == current_user.id,
                BillingAddress.id != address_id,
            )
            .values(is_default=False)
        )

    # Update is_business based on current (or incoming) GSTIN
    incoming_gstin = payload.get("gstin", addr.gstin)
    payload["is_business"] = bool(incoming_gstin)

    for key, value in payload.items():
        setattr(addr, key, value)

    await db.commit()
    await db.refresh(addr)
    return _to_response(addr)


@router.delete("/{address_id}", status_code=204)
async def delete_billing_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a billing address."""
    result = await db.execute(
        select(BillingAddress).where(
            BillingAddress.id == address_id,
            BillingAddress.user_id == current_user.id,
        )
    )
    addr = result.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    was_default = bool(addr.is_default)
    await db.delete(addr)
    await db.commit()

    # If we deleted the default, promote the most recent remaining one
    if was_default:
        remaining = await db.execute(
            select(BillingAddress)
            .where(BillingAddress.user_id == current_user.id)
            .order_by(BillingAddress.id.desc())
            .limit(1)
        )
        new_default = remaining.scalar_one_or_none()
        if new_default:
            new_default.is_default = True
            await db.commit()


@router.put("/{address_id}/default", response_model=BillingAddressResponse)
async def set_default_billing_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark the given address as default, unset others."""
    result = await db.execute(
        select(BillingAddress).where(
            BillingAddress.id == address_id,
            BillingAddress.user_id == current_user.id,
        )
    )
    addr = result.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    await db.execute(
        update(BillingAddress)
        .where(BillingAddress.user_id == current_user.id)
        .values(is_default=False)
    )
    addr.is_default = True
    await db.commit()
    await db.refresh(addr)
    return _to_response(addr)
