from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from backend.database import get_db
from backend.core.security import get_current_user
from backend.models.user import User
from backend.models.community_post import CommunityPost
from backend.models.post_comment import PostComment
from backend.models.post_like import PostLike
from backend.schemas.community import PostCreate, PostRead, CommentCreate, CommentRead, LikeRead

router = APIRouter()

@router.get("/posts", response_model=List[PostRead])
async def list_posts(
    search: str | None = None,
    sort_by: str | None = "recent",
    db: AsyncSession = Depends(get_db)
):
    query = select(CommunityPost)
    if search:
        query = query.where(CommunityPost.content.ilike(f"%{search}%"))
        
    if sort_by == "recent":
        query = query.order_by(CommunityPost.created_at.desc())
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/posts", response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_in: PostCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    post = CommunityPost(
        user_id=current_user.id,
        trip_id=post_in.trip_id,
        activity_id=post_in.activity_id,
        content=post_in.content,
        image_url=post_in.image_url
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post

@router.get("/posts/{post_id}", response_model=PostRead)
async def get_post(post_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.post("/posts/{post_id}/like", response_model=LikeRead)
async def toggle_like(
    post_id: UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Check if post exists
    post_res = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    if not post_res.scalars().first():
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Check if already liked
    like_res = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    )
    existing_like = like_res.scalars().first()
    
    if existing_like:
        await db.delete(existing_like)
        await db.commit()
        # Return a dummy representation to satisfy the response model (or modify schema to return status)
        # Technically toggling off means it's deleted. Let's return the deleted one.
        return existing_like
    else:
        new_like = PostLike(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        await db.commit()
        await db.refresh(new_like)
        return new_like

@router.post("/posts/{post_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: UUID, 
    comment_in: CommentCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    post_res = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    if not post_res.scalars().first():
        raise HTTPException(status_code=404, detail="Post not found")
        
    comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment_in.content
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment
