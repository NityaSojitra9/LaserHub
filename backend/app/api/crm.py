"""
Customer CRM API — per-vendor customer intelligence + lightweight outreach.
"""
import json
import logging
import secrets
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models import Order, User, Vendor, VendorOrder

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------- helpers ----------

def _tier_for_spent(total_spent: float) -> str:
    if total_spent >= 100_000:
        return "platinum"
    if total_spent >= 25_000:
        return "gold"
    if total_spent >= 5_000:
        return "silver"
    return "bronze"


async def _resolve_vendor_id(current: dict, db: AsyncSession) -> int:
    vid = current.get("vendor_id")
    if vid:
        return vid
    u_res = await db.execute(select(User).where(User.email == current["email"]))
    u = u_res.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=401, detail="User not found")
    v_res = await db.execute(select(Vendor).where(Vendor.user_id == u.id))
    v = v_res.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=403, detail="Vendor account required")
    return v.id


async def _vendor_order_ids(db: AsyncSession, vendor_id: int) -> List[int]:
    res = await db.execute(select(VendorOrder.order_id).where(VendorOrder.vendor_id == vendor_id))
    return [row[0] for row in res.all()]


# ---------- schemas ----------

class CustomerSummary(BaseModel):
    email: str
    name: str
    phone: Optional[str] = None
    order_count: int
    total_spent: float
    first_order_date: Optional[datetime]
    last_order_date: Optional[datetime]
    avg_order_value: float
    tier: str
    days_since_last_order: Optional[int]
    notes: str = ""
    tags: List[str] = []


class CustomerDetail(CustomerSummary):
    orders: List[dict] = []


class NotesUpdate(BaseModel):
    notes: str = ""
    tags: Optional[List[str]] = None


class BroadcastFilter(BaseModel):
    tier: Optional[str] = None
    min_spent: Optional[float] = None


class BroadcastRequest(BaseModel):
    subject: str
    body: str
    filter: BroadcastFilter = BroadcastFilter()


class DiscountCodeRequest(BaseModel):
    percent_off: float = 10.0
    tier: Optional[str] = None
    min_spent: Optional[float] = None
    expires_days: int = 30


# ---------- endpoints ----------

@router.get("/customers", response_model=List[CustomerSummary])
async def list_customers(
    tier: Optional[str] = None,
    search: Optional[str] = None,
    min_spent: Optional[float] = Query(None, ge=0),
    days_since_order_gt: Optional[int] = Query(None, ge=0),
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(require_role("owner", "operator", "accountant")),
):
    vendor_id = await _resolve_vendor_id(current, db)
    order_ids = await _vendor_order_ids(db, vendor_id)

    # Aggregate orders by customer_email for this vendor
    q = (
        select(
            Order.customer_email.label("email"),
            func.max(Order.customer_name).label("name"),
            func.count(Order.id).label("order_count"),
            func.sum(Order.total_amount).label("total_spent"),
            func.min(Order.created_at).label("first_order_date"),
            func.max(Order.created_at).label("last_order_date"),
        )
        .group_by(Order.customer_email)
    )
    if order_ids:
        q = q.where(Order.id.in_(order_ids))
    elif vendor_id:
        # Vendor has zero linked orders yet — still allow a fallback to owner-user orders
        # but for safety, return empty
        return []

    if search:
        term = f"%{search.lower()}%"
        q = q.where(
            func.lower(Order.customer_email).like(term)
            | func.lower(Order.customer_name).like(term)
        )

    rows = (await db.execute(q)).all()

    # Lookup notes/tags from User table
    emails = [r.email for r in rows]
    users_map = {}
    if emails:
        u_res = await db.execute(select(User).where(User.email.in_(emails)))
        for u in u_res.scalars().all():
            users_map[u.email] = u

    out: List[CustomerSummary] = []
    now = datetime.utcnow()
    for r in rows:
        spent = float(r.total_spent or 0)
        oc = int(r.order_count or 0)
        last = r.last_order_date
        days_since = (now - last).days if last else None
        t = _tier_for_spent(spent)
        if tier and t != tier:
            continue
        if min_spent is not None and spent < min_spent:
            continue
        if days_since_order_gt is not None and (days_since is None or days_since <= days_since_order_gt):
            continue
        u = users_map.get(r.email)
        tags = []
        if u and u.crm_tags:
            try:
                tags = json.loads(u.crm_tags)
            except Exception:
                tags = []
        out.append(
            CustomerSummary(
                email=r.email,
                name=r.name or "",
                order_count=oc,
                total_spent=spent,
                first_order_date=r.first_order_date,
                last_order_date=last,
                avg_order_value=(spent / oc) if oc else 0,
                tier=t,
                days_since_last_order=days_since,
                notes=(u.crm_notes if u else "") or "",
                tags=tags,
            )
        )
    out.sort(key=lambda c: c.total_spent, reverse=True)
    return out


@router.get("/customers/{email}", response_model=CustomerDetail)
async def get_customer(
    email: str,
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(require_role("owner", "operator", "accountant")),
):
    vendor_id = await _resolve_vendor_id(current, db)
    order_ids = await _vendor_order_ids(db, vendor_id)

    q = select(Order).where(Order.customer_email == email).order_by(desc(Order.created_at))
    if order_ids:
        q = q.where(Order.id.in_(order_ids))
    orders = (await db.execute(q)).scalars().all()
    if not orders:
        raise HTTPException(status_code=404, detail="Customer not found")

    spent = sum(o.total_amount or 0 for o in orders)
    oc = len(orders)
    last = max(o.created_at for o in orders)
    first = min(o.created_at for o in orders)
    days_since = (datetime.utcnow() - last).days if last else None

    u_res = await db.execute(select(User).where(User.email == email))
    u = u_res.scalar_one_or_none()
    tags: List[str] = []
    if u and u.crm_tags:
        try:
            tags = json.loads(u.crm_tags)
        except Exception:
            tags = []

    return CustomerDetail(
        email=email,
        name=orders[0].customer_name or "",
        order_count=oc,
        total_spent=spent,
        first_order_date=first,
        last_order_date=last,
        avg_order_value=spent / oc if oc else 0,
        tier=_tier_for_spent(spent),
        days_since_last_order=days_since,
        notes=(u.crm_notes if u else "") or "",
        tags=tags,
        orders=[
            {
                "id": o.id,
                "order_number": o.order_number,
                "total_amount": o.total_amount,
                "status": o.status,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "thickness_mm": o.thickness_mm,
                "quantity": o.quantity,
            }
            for o in orders
        ],
    )


@router.put("/customers/{email}/notes")
async def update_customer_notes(
    email: str,
    payload: NotesUpdate,
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(require_role("owner", "operator")),
):
    u_res = await db.execute(select(User).where(User.email == email))
    user = u_res.scalar_one_or_none()
    if not user:
        # Store-on-user requires an account; if none, just accept silently
        return {"status": "no_user_account"}
    user.crm_notes = payload.notes or ""
    if payload.tags is not None:
        user.crm_tags = json.dumps(payload.tags)
    await db.commit()
    return {"status": "updated"}


@router.post("/broadcast")
async def broadcast_email(
    payload: BroadcastRequest,
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(require_role("owner")),
):
    vendor_id = await _resolve_vendor_id(current, db)
    order_ids = await _vendor_order_ids(db, vendor_id)
    q = select(Order.customer_email, func.sum(Order.total_amount).label("spent")).group_by(Order.customer_email)
    if order_ids:
        q = q.where(Order.id.in_(order_ids))
    rows = (await db.execute(q)).all()
    recipients = []
    for r in rows:
        spent = float(r.spent or 0)
        if payload.filter.min_spent is not None and spent < payload.filter.min_spent:
            continue
        if payload.filter.tier and _tier_for_spent(spent) != payload.filter.tier:
            continue
        recipients.append(r.customer_email)

    logger.info(
        "crm.broadcast vendor_id=%s subject=%r recipients=%d", vendor_id, payload.subject, len(recipients)
    )
    return {"status": "queued", "count": len(recipients), "recipients": recipients}


@router.post("/discount-code")
async def create_discount_code(
    payload: DiscountCodeRequest,
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(require_role("owner")),
):
    vendor_id = await _resolve_vendor_id(current, db)
    code = f"VIP{secrets.token_hex(3).upper()}"
    logger.info(
        "crm.discount_code vendor_id=%s code=%s pct=%s tier=%s min_spent=%s",
        vendor_id, code, payload.percent_off, payload.tier, payload.min_spent,
    )
    return {
        "code": code,
        "percent_off": payload.percent_off,
        "tier": payload.tier,
        "min_spent": payload.min_spent,
        "expires_days": payload.expires_days,
    }
