def test_get_users_me(client, mock_current_user):
    response = client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == mock_current_user.email
    assert data["first_name"] == mock_current_user.first_name

def test_patch_users_me(client, mock_db_session, mock_current_user):
    # Test partial update
    update_data = {"first_name": "UpdatedName", "city": "New York"}
    response = client.patch("/users/me", json=update_data)
    assert response.status_code == 200
    data = response.json()
    
    # Since we mocked DB, the service updates the in-memory user instance
    assert data["first_name"] == "UpdatedName"
    assert data["city"] == "New York"
    assert data["email"] == mock_current_user.email  # Unchanged
    
    # Verify DB calls
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()

def test_post_users_me_photo(client, mock_db_session):
    from unittest.mock import patch
    # Mock Cloudinary upload
    mock_upload_response = {"secure_url": "https://res.cloudinary.com/demo/image/upload/sample.jpg"}
    with patch("cloudinary.uploader.upload", return_value=mock_upload_response) as mock_upload:
        files = {'file': ('test.jpg', b'dummy content', 'image/jpeg')}
        response = client.post("/users/me/photo", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "photo_url" in data
        assert data["photo_url"] == "https://res.cloudinary.com/demo/image/upload/sample.jpg"
        
        mock_upload.assert_called_once()
        
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()

