import pytest
from uuid import uuid4

pytestmark = pytest.mark.integration

# ─── Full Community Flow ──────────────────────────────────────────────

async def test_live_community_flow(live_client):
    """Create post → list → comment → like → get detail."""
    # 1. Create a Post
    post_data = {
        "content": "I had a great time in Paris!",
        "trip_id": None
    }
    res_post = await live_client.post("/community/posts", json=post_data)
    assert res_post.status_code == 201
    post = res_post.json()
    post_id = post["id"]
    
    # 2. Get posts
    res_list = await live_client.get("/community/posts")
    assert res_list.status_code == 200
    assert any(p["id"] == post_id for p in res_list.json())
    
    # 3. Add a Comment
    comment_data = {"content": "Looks amazing!"}
    res_comment = await live_client.post(f"/community/posts/{post_id}/comments", json=comment_data)
    assert res_comment.status_code == 201
    comment = res_comment.json()
    assert comment["content"] == "Looks amazing!"
    assert comment["post_id"] == post_id
    
    # 4. Like the Post
    res_like = await live_client.post(f"/community/posts/{post_id}/like")
    assert res_like.status_code == 200
    like = res_like.json()
    assert like["post_id"] == post_id
    
    # 5. Fetch Post Details
    res_detail = await live_client.get(f"/community/posts/{post_id}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["id"] == post_id

# ─── Individual Tests ─────────────────────────────────────────────────

async def test_live_create_post(live_client):
    """POST /community/posts creates a post and returns 201."""
    response = await live_client.post("/community/posts", json={
        "content": "Integration test post"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Integration test post"
    assert "id" in data
    assert "created_at" in data

async def test_live_list_posts(live_client):
    """GET /community/posts returns a list of posts."""
    # Create a post first so there's at least one
    await live_client.post("/community/posts", json={"content": "List test post"})

    response = await live_client.get("/community/posts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

async def test_live_get_single_post(live_client):
    """GET /community/posts/{id} returns a single post."""
    res_create = await live_client.post("/community/posts", json={
        "content": "Single post fetch test"
    })
    post_id = res_create.json()["id"]

    response = await live_client.get(f"/community/posts/{post_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == post_id
    assert data["content"] == "Single post fetch test"

async def test_live_get_post_not_found(live_client):
    """GET /community/posts/{fake_id} returns 404."""
    fake_id = str(uuid4())
    response = await live_client.get(f"/community/posts/{fake_id}")
    assert response.status_code == 404

async def test_live_toggle_like_twice(live_client):
    """Liking a post twice should toggle (unlike)."""
    res_post = await live_client.post("/community/posts", json={
        "content": "Like toggle test"
    })
    post_id = res_post.json()["id"]

    # First like
    res1 = await live_client.post(f"/community/posts/{post_id}/like")
    assert res1.status_code == 200

    # Second like should toggle (unlike) — still 200
    res2 = await live_client.post(f"/community/posts/{post_id}/like")
    assert res2.status_code == 200

async def test_live_add_comment(live_client):
    """POST /community/posts/{id}/comments adds a comment."""
    res_post = await live_client.post("/community/posts", json={
        "content": "Comment test post"
    })
    post_id = res_post.json()["id"]

    response = await live_client.post(
        f"/community/posts/{post_id}/comments",
        json={"content": "Great post!"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Great post!"
    assert data["post_id"] == post_id
