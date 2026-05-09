"""
Design management API - create, share, like designs
"""
import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Design, DesignLike, DesignListing, UploadedFile, User
from app.schemas import DesignCreate
from app.api.auth import get_current_user


class TagsUpdate(BaseModel):
    tags: List[str]


router = APIRouter()


@router.post("/")
async def create_design(
    design_data: DesignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new design from an uploaded file"""
    # Verify file exists
    result = await db.execute(
        select(UploadedFile).where(UploadedFile.file_id == design_data.file_id)
    )
    uploaded_file = result.scalar_one_or_none()
    if not uploaded_file:
        raise HTTPException(status_code=404, detail="File not found")

    # Only the uploader (or a platform super_admin) may link this file to a design.
    # `uploaded_by` may not yet exist on UploadedFile — fall back to current_user.id
    # so pre-migration uploads remain usable. Post-migration, the check is enforced.
    file_owner = getattr(uploaded_file, "uploaded_by", None)
    if file_owner is not None and file_owner != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="You do not own this file")

    design = Design(
        creator_id=current_user.id,
        file_id=uploaded_file.id,
        title=design_data.title,
        description=design_data.description,
        category=design_data.category,
        tags=json.dumps(design_data.tags) if design_data.tags else None,
        is_public=design_data.is_public,
    )

    db.add(design)
    await db.commit()
    await db.refresh(design)

    return {
        "id": design.id,
        "title": design.title,
        "is_public": design.is_public,
        "created_at": design.created_at,
    }


@router.post("/{design_id}/share")
async def toggle_design_sharing(
    design_id: int,
    is_public: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle whether a design is shared publicly (open-source)"""
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    if design.creator_id != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to modify this design")

    design.is_public = is_public
    await db.commit()

    return {"id": design.id, "is_public": design.is_public}


@router.post("/{design_id}/like")
async def toggle_like(
    design_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Like/unlike a design"""
    user_id = current_user.id
    # Check if already liked
    result = await db.execute(
        select(DesignLike).where(
            DesignLike.user_id == user_id,
            DesignLike.design_id == design_id
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        # Decrement likes
        design_result = await db.execute(select(Design).where(Design.id == design_id))
        design = design_result.scalar_one_or_none()
        if design:
            design.likes_count = max(0, design.likes_count - 1)
        await db.commit()
        return {"liked": False}
    else:
        like = DesignLike(user_id=user_id, design_id=design_id)
        db.add(like)
        design_result = await db.execute(select(Design).where(Design.id == design_id))
        design = design_result.scalar_one_or_none()
        if design:
            design.likes_count = (design.likes_count or 0) + 1
        await db.commit()
        return {"liked": True}


@router.get("/my")
async def get_my_designs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get designs created by current user"""
    result = await db.execute(
        select(Design).where(Design.creator_id == current_user.id).order_by(Design.created_at.desc())
    )
    designs = result.scalars().all()

    return [
        {
            "id": d.id, "title": d.title, "description": d.description,
            "category": d.category, "is_public": d.is_public,
            "tags": json.loads(d.tags) if d.tags else [],
            "likes_count": d.likes_count, "downloads_count": d.downloads_count,
            "created_at": d.created_at,
        }
        for d in designs
    ]


@router.put("/{design_id}/tags")
async def update_design_tags(
    design_id: int,
    body: TagsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update tags for a design"""
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    if design.creator_id != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to modify this design")

    # Validate: max 10 tags, max 30 chars each
    tags = [t.strip()[:30] for t in body.tags if t.strip()][:10]
    design.tags = json.dumps(tags)
    await db.commit()
    return {"design_id": design_id, "tags": tags}
