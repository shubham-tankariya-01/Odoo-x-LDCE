from unittest.mock import MagicMock
from uuid import uuid4
from datetime import datetime, timezone
from backend.tests.test_catalog import setup_mock_db_result

def test_list_posts(client, mock_db_session):
    mock_post = MagicMock()
    mock_post.id = uuid4()
    mock_post.user_id = uuid4()
    mock_post.content = "Had a great time!"
    mock_post.created_at = datetime.now(timezone.utc)
    mock_post.trip_id = None
    mock_post.activity_id = None
    mock_post.image_url = None
    
    setup_mock_db_result(mock_db_session, [mock_post], is_scalar_first=False)
    
    response = client.get("/community/posts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["content"] == "Had a great time!"

def test_create_post(client, mock_db_session):
    async def mock_refresh(instance):
        instance.id = uuid4()
        instance.created_at = datetime.now(timezone.utc)
    mock_db_session.refresh.side_effect = mock_refresh
    
    post_data = {"content": "This is a new post"}
    response = client.post("/community/posts", json=post_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "This is a new post"
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once()

def test_get_post(client, mock_db_session):
    post_id = uuid4()
    mock_post = MagicMock()
    mock_post.id = post_id
    mock_post.user_id = uuid4()
    mock_post.content = "Detailed post view"
    mock_post.created_at = datetime.now(timezone.utc)
    mock_post.trip_id = None
    mock_post.activity_id = None
    mock_post.image_url = None
    
    setup_mock_db_result(mock_db_session, mock_post, is_scalar_first=True)
    
    response = client.get(f"/community/posts/{post_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Detailed post view"

def test_toggle_like(client, mock_db_session):
    post_id = uuid4()
    
    # Mock post exists
    mock_post = MagicMock()
    mock_post.id = post_id
    
    # Mock no existing like (first call for post, second for like)
    mock_result_post = MagicMock()
    mock_scalars_post = MagicMock()
    mock_scalars_post.first.return_value = mock_post
    mock_result_post.scalars.return_value = mock_scalars_post
    
    mock_result_like = MagicMock()
    mock_scalars_like = MagicMock()
    mock_scalars_like.first.return_value = None
    mock_result_like.scalars.return_value = mock_scalars_like
    
    mock_db_session.execute.side_effect = [mock_result_post, mock_result_like]
    
    async def mock_refresh(instance):
        instance.id = uuid4()
    mock_db_session.refresh.side_effect = mock_refresh
    
    response = client.post(f"/community/posts/{post_id}/like")
    assert response.status_code == 200
    data = response.json()
    assert data["post_id"] == str(post_id)

def test_add_comment(client, mock_db_session):
    post_id = uuid4()
    
    # Mock post exists
    mock_post = MagicMock()
    mock_post.id = post_id
    setup_mock_db_result(mock_db_session, mock_post, is_scalar_first=True)
    
    async def mock_refresh(instance):
        instance.id = uuid4()
        instance.created_at = datetime.now(timezone.utc)
    mock_db_session.refresh.side_effect = mock_refresh
    
    comment_data = {"content": "Nice trip!"}
    response = client.post(f"/community/posts/{post_id}/comments", json=comment_data)
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Nice trip!"
    assert data["post_id"] == str(post_id)
