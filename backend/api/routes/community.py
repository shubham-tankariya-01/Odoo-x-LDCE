from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID

from backend.database import get_db
from backend.core.security import get_current_user, get_optional_current_user
from backend.models.user import User
from backend.models.community_post import CommunityPost
from backend.models.post_comment import PostComment
from backend.models.post_like import PostLike
from backend.models.trip import Trip
from backend.models.activity import Activity
from backend.schemas.community import PostCreate, PostRead, CommentCreate, CommentRead, LikeRead

router = APIRouter()

def get_user_display_name(user: User | None) -> str:
    if not user:
        return "Traveler"
    full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    if full_name:
        return full_name
    if user.email:
        return user.email.split("@")[0].capitalize()
    return "Traveler"

@router.get("/posts", response_model=List[PostRead])
async def list_posts(
    search: str | None = None,
    sort_by: str | None = "recent",
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user)
):
    query = select(CommunityPost)
    if search:
        query = query.where(CommunityPost.content.ilike(f"%{search}%"))
        
    if sort_by == "recent":
        query = query.order_by(CommunityPost.created_at.desc())
    else:
        query = query.order_by(CommunityPost.created_at.desc())
        
    result = await db.execute(query)
    posts = result.scalars().all()

    if not posts:
        return []

    post_ids = [p.id for p in posts]
    user_ids = list(set([p.user_id for p in posts if p.user_id]))
    trip_ids = list(set([p.trip_id for p in posts if p.trip_id]))
    activity_ids = list(set([p.activity_id for p in posts if p.activity_id]))

    # Fetch comments for all these posts
    comments_stmt = (
        select(PostComment)
        .where(PostComment.post_id.in_(post_ids))
        .order_by(PostComment.created_at.asc())
    )
    comments_res = await db.execute(comments_stmt)
    all_comments = comments_res.scalars().all()
    for c in all_comments:
        if c.user_id and c.user_id not in user_ids:
            user_ids.append(c.user_id)

    # Fetch all users
    users_stmt = select(User).where(User.id.in_(user_ids))
    users_res = await db.execute(users_stmt)
    users_map = {u.id: u for u in users_res.scalars().all()}

    # Fetch trips and activities names
    trips_map = {}
    if trip_ids:
        t_res = await db.execute(select(Trip).where(Trip.id.in_(trip_ids)))
        trips_map = {t.id: t.name for t in t_res.scalars().all()}

    acts_map = {}
    if activity_ids:
        a_res = await db.execute(select(Activity).where(Activity.id.in_(activity_ids)))
        acts_map = {a.id: a.name for a in a_res.scalars().all()}

    # Fetch likes count per post
    likes_stmt = (
        select(PostLike.post_id, func.count(PostLike.id))
        .where(PostLike.post_id.in_(post_ids))
        .group_by(PostLike.post_id)
    )
    likes_res = await db.execute(likes_stmt)
    likes_count_map = {row[0]: row[1] for row in likes_res.all()}

    # Fetch user's liked posts
    user_liked_set = set()
    if current_user:
        user_likes_stmt = select(PostLike.post_id).where(
            PostLike.post_id.in_(post_ids),
            PostLike.user_id == current_user.id
        )
        user_likes_res = await db.execute(user_likes_stmt)
        user_liked_set = set(user_likes_res.scalars().all())

    # Group comments by post_id
    post_comments_map = {}
    for c in all_comments:
        u = users_map.get(c.user_id)
        comment_dto = CommentRead(
            id=c.id,
            post_id=c.post_id,
            user_id=c.user_id,
            user_name=get_user_display_name(u),
            user_avatar=u.photo_url if u else None,
            content=c.content,
            created_at=c.created_at
        )
        post_comments_map.setdefault(c.post_id, []).append(comment_dto)

    # Build response DTOs
    response_posts = []
    for p in posts:
        author = users_map.get(p.user_id)
        p_dto = PostRead(
            id=p.id,
            user_id=p.user_id,
            user_name=get_user_display_name(author),
            user_avatar=author.photo_url if author else None,
            trip_id=p.trip_id,
            activity_id=p.activity_id,
            trip_name=trips_map.get(p.trip_id),
            activity_name=acts_map.get(p.activity_id),
            content=p.content,
            image_url=p.image_url,
            created_at=p.created_at,
            likes_count=likes_count_map.get(p.id, 0),
            is_liked=p.id in user_liked_set,
            comments=post_comments_map.get(p.id, [])
        )
        response_posts.append(p_dto)

    return response_posts

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

    trip_name = None
    if post.trip_id:
        t_res = await db.execute(select(Trip).where(Trip.id == post.trip_id))
        t = t_res.scalars().first()
        trip_name = t.name if t else None

    activity_name = None
    if post.activity_id:
        a_res = await db.execute(select(Activity).where(Activity.id == post.activity_id))
        a = a_res.scalars().first()
        activity_name = a.name if a else None

    return PostRead(
        id=post.id,
        user_id=post.user_id,
        user_name=get_user_display_name(current_user),
        user_avatar=current_user.photo_url,
        trip_id=post.trip_id,
        activity_id=post.activity_id,
        trip_name=trip_name,
        activity_name=activity_name,
        content=post.content,
        image_url=post.image_url,
        created_at=post.created_at,
        likes_count=0,
        is_liked=False,
        comments=[]
    )

@router.get("/posts/{post_id}", response_model=PostRead)
async def get_post(
    post_id: UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user)
):
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    author_res = await db.execute(select(User).where(User.id == post.user_id))
    author = author_res.scalars().first()

    comments_res = await db.execute(
        select(PostComment).where(PostComment.post_id == post.id).order_by(PostComment.created_at.asc())
    )
    comments = comments_res.scalars().all()
    
    comment_user_ids = list(set([c.user_id for c in comments if c.user_id]))
    u_map = {}
    if comment_user_ids:
        u_res = await db.execute(select(User).where(User.id.in_(comment_user_ids)))
        u_map = {u.id: u for u in u_res.scalars().all()}

    comments_dto = [
        CommentRead(
            id=c.id,
            post_id=c.post_id,
            user_id=c.user_id,
            user_name=get_user_display_name(u_map.get(c.user_id)),
            user_avatar=u_map.get(c.user_id).photo_url if u_map.get(c.user_id) else None,
            content=c.content,
            created_at=c.created_at
        )
        for c in comments
    ]

    likes_count_res = await db.execute(
        select(func.count(PostLike.id)).where(PostLike.post_id == post.id)
    )
    likes_count = likes_count_res.scalar() or 0

    is_liked = False
    if current_user:
        user_like = await db.execute(
            select(PostLike).where(PostLike.post_id == post.id, PostLike.user_id == current_user.id)
        )
        is_liked = user_like.scalars().first() is not None

    return PostRead(
        id=post.id,
        user_id=post.user_id,
        user_name=get_user_display_name(author),
        user_avatar=author.photo_url if author else None,
        trip_id=post.trip_id,
        activity_id=post.activity_id,
        content=post.content,
        image_url=post.image_url,
        created_at=post.created_at,
        likes_count=likes_count,
        is_liked=is_liked,
        comments=comments_dto
    )

@router.post("/posts/{post_id}/like", response_model=LikeRead)
async def toggle_like(
    post_id: UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    post_res = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    if not post_res.scalars().first():
        raise HTTPException(status_code=404, detail="Post not found")
        
    like_res = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    )
    existing_like = like_res.scalars().first()
    
    is_liked = False
    like_id = None
    if existing_like:
        await db.delete(existing_like)
        await db.commit()
        is_liked = False
    else:
        new_like = PostLike(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        await db.commit()
        await db.refresh(new_like)
        like_id = new_like.id
        is_liked = True

    # Get updated total count
    count_res = await db.execute(
        select(func.count(PostLike.id)).where(PostLike.post_id == post_id)
    )
    total_likes = count_res.scalar() or 0

    return LikeRead(
        id=like_id,
        post_id=post_id,
        user_id=current_user.id,
        is_liked=is_liked,
        likes_count=total_likes
    )

@router.get("/posts/{post_id}/comments", response_model=List[CommentRead])
async def list_post_comments(post_id: UUID, db: AsyncSession = Depends(get_db)):
    comments_res = await db.execute(
        select(PostComment).where(PostComment.post_id == post_id).order_by(PostComment.created_at.asc())
    )
    comments = comments_res.scalars().all()
    if not comments:
        return []
        
    user_ids = list(set([c.user_id for c in comments if c.user_id]))
    u_res = await db.execute(select(User).where(User.id.in_(user_ids)))
    u_map = {u.id: u for u in u_res.scalars().all()}

    return [
        CommentRead(
            id=c.id,
            post_id=c.post_id,
            user_id=c.user_id,
            user_name=get_user_display_name(u_map.get(c.user_id)),
            user_avatar=u_map.get(c.user_id).photo_url if u_map.get(c.user_id) else None,
            content=c.content,
            created_at=c.created_at
        )
        for c in comments
    ]

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

    return CommentRead(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        user_name=get_user_display_name(current_user),
        user_avatar=current_user.photo_url,
        content=comment.content,
        created_at=comment.created_at
    )

@router.delete("/posts/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    comment_res = await db.execute(select(PostComment).where(PostComment.id == comment_id))
    comment = comment_res.scalars().first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
    await db.delete(comment)
    await db.commit()


