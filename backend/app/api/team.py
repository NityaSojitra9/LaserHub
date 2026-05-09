"""
Team Accounts API — invite teammates to a vendor account with scoped roles.
"""
import json
import logging
import secrets
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models import ActivityLog, TeamMember, User, Vendor

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_ROLES = {"owner", "operator", "designer", "accountant"}


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


async def log_activity(
    db: AsyncSession,
    vendor_id: int,
    user_id: int,
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    metadata: Optional[dict] = None,
) -> None:
    """Record a vendor-scoped activity log entry. Safe to await without commit."""
    try:
        entry = ActivityLog(
            vendor_id=vendor_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=json.dumps(metadata or {}),
        )
        db.add(entry)
        await db.flush()
    except Exception as e:
        logger.warning("log_activity failed: %s", e)


# ---------- schemas ----------

class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "operator"


class RoleUpdate(BaseModel):
    role: str


class TeamMemberResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    role: str
    accepted: bool
    invited_at: datetime
    last_active_at: Optional[datetime] = None


class ActivityEntryResponse(BaseModel):
    id: int
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    metadata: dict = {}
    created_at: datetime


# ---------- endpoints ----------

@router.get("/", response_model=List[TeamMemberResponse])
async def list_team(
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(require_role("owner", "operator", "designer", "accountant")),
):
    vendor_id = await _resolve_vendor_id(current, db)
    res = await db.execute(
        select(TeamMember).where(TeamMember.vendor_id == vendor_id).order_by(desc(TeamMember.invited_at))
    )
    members = res.scalars().all()
    # Gather user info
    user_ids = [m.user_id for m in members if m.user_id]
    users_map = {}
    if user_ids:
        u_res = await db.execute(select(User).where(User.id.in_(user_ids)))
        users_map = {u.id: u for u in u_res.scalars().all()}
    out = []
    for m in members:
        u = users_map.get(m.user_id)
        out.append(
            TeamMemberResponse(
                id=m.id,
                email=(u.email if u else None) or m.email or "",
                name=u.name if u else None,
                role=m.role,
                accepted=bool(m.accepted),
                invited_at=m.invited_at,
                last_active_at=m.last_active_at,
            )
        )
    return out


@router.post("/invite", response_model=TeamMemberResponse)
async def invite_member(
    payload: InviteRequest,
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(require_role("owner")),
):
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed: {sorted(ALLOWED_ROLES)}")
    vendor_id = await _resolve_vendor_id(current, db)

    u_res = await db.execute(select(User).where(User.email == payload.email))
    invitee = u_res.scalar_one_or_none()

    # Owner (self) user lookup for invited_by
    me_res = await db.execute(select(User).where(User.email == current["email"]))
    me = me_res.scalar_one_or_none()

    # Check duplicates
    if invitee:
        dup = await db.execute(
            select(TeamMember).where(
                TeamMember.vendor_id == vendor_id, TeamMember.user_id == invitee.id
            )
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="User already invited or on team")

    token = secrets.token_urlsafe(24)
    tm = TeamMember(
        vendor_id=vendor_id,
        user_id=invitee.id if invitee else 0,
        email=payload.email,
        role=payload.role,
        invited_at=datetime.utcnow(),
        invited_by_user_id=me.id if me else None,
        accepted=False,
        invite_token=token,
    )
    db.add(tm)
    await db.flush()
    if me:
        await log_activity(
            db, vendor_id, me.id, "team_invited", "team_member", tm.id, {"email": payload.email, "role": payload.role}
        )
    await db.commit()
    await db.refresh(tm)

    logger.info(
        "team.invite vendor_id=%s email=%s role=%s token=%s",
        vendor_id, payload.email, payload.role, token,
    )

    return TeamMemberResponse(
        id=tm.id,
        email=payload.email,
        name=invitee.name if invitee else None,
        role=tm.role,
        accepted=False,
        invited_at=tm.invited_at,
        last_active_at=None,
    )


@router.post("/accept/{token}")
async def accept_invite(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(TeamMember).where(TeamMember.invite_token == token))
    tm = res.scalar_one_or_none()
    if not tm:
        raise HTTPException(status_code=404, detail="Invite not found")
    if tm.accepted:
        return {"status": "already_accepted"}
    tm.accepted = True
    tm.invite_token = None
    await db.commit()
    return {"status": "accepted", "vendor_id": tm.vendor_id, "role": tm.role}


@router.put("/{member_id}/role", response_model=TeamMemberResponse)
async def update_role(
    member_id: int,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(require_role("owner")),
):
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed: {sorted(ALLOWED_ROLES)}")
    vendor_id = await _resolve_vendor_id(current, db)
    res = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id, TeamMember.vendor_id == vendor_id)
    )
    tm = res.scalar_one_or_none()
    if not tm:
        raise HTTPException(status_code=404, detail="Member not found")
    tm.role = payload.role

    me_res = await db.execute(select(User).where(User.email == current["email"]))
    me = me_res.scalar_one_or_none()
    if me:
        await log_activity(db, vendor_id, me.id, "team_role_changed", "team_member", tm.id, {"role": payload.role})
    await db.commit()

    u = None
    if tm.user_id:
        u_res = await db.execute(select(User).where(User.id == tm.user_id))
        u = u_res.scalar_one_or_none()
    return TeamMemberResponse(
        id=tm.id,
        email=(u.email if u else None) or tm.email or "",
        name=u.name if u else None,
        role=tm.role,
        accepted=bool(tm.accepted),
        invited_at=tm.invited_at,
        last_active_at=tm.last_active_at,
    )


@router.delete("/{member_id}")
async def remove_member(
    member_id: int,
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(require_role("owner")),
):
    vendor_id = await _resolve_vendor_id(current, db)
    res = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id, TeamMember.vendor_id == vendor_id)
    )
    tm = res.scalar_one_or_none()
    if not tm:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.delete(tm)

    me_res = await db.execute(select(User).where(User.email == current["email"]))
    me = me_res.scalar_one_or_none()
    if me:
        await log_activity(db, vendor_id, me.id, "team_removed", "team_member", member_id)
    await db.commit()
    return {"status": "removed"}


@router.get("/activity", response_model=List[ActivityEntryResponse])
async def get_activity(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(require_role("owner", "operator", "designer", "accountant")),
):
    vendor_id = await _resolve_vendor_id(current, db)
    offset = (page - 1) * per_page
    res = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.vendor_id == vendor_id)
        .order_by(desc(ActivityLog.created_at))
        .offset(offset)
        .limit(per_page)
    )
    entries = res.scalars().all()
    user_ids = list({e.user_id for e in entries if e.user_id})
    users_map = {}
    if user_ids:
        u_res = await db.execute(select(User).where(User.id.in_(user_ids)))
        users_map = {u.id: u for u in u_res.scalars().all()}
    out = []
    for e in entries:
        u = users_map.get(e.user_id)
        try:
            meta = json.loads(e.metadata_json) if e.metadata_json else {}
        except Exception:
            meta = {}
        out.append(
            ActivityEntryResponse(
                id=e.id,
                user_email=u.email if u else None,
                user_name=u.name if u else None,
                action=e.action,
                entity_type=e.entity_type,
                entity_id=e.entity_id,
                metadata=meta,
                created_at=e.created_at,
            )
        )
    return out
