import React, { useState, useEffect } from 'react';
import { listPosts, toggleLikePost, addComment, deleteComment, getActivities, listTrips, createPost } from '../api/client';
import { MessageCircle, Heart, Search, ImageIcon, Send, X, Tag, MapPin, Compass, Trash2, ChevronDown, ChevronUp, Loader2, Sparkles, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


export function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', image_url: '', activity_id: '', trip_id: '' });
  const [posting, setPosting] = useState(false);
  
  const [trips, setTrips] = useState([]);
  const [activities, setActivities] = useState([]);

  // Toggled comments visibility per post
  const [openComments, setOpenComments] = useState({});

  // Comment inputs tracked per post
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  useEffect(() => {
    fetchPosts();
  }, [search, sortBy]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await listPosts({ search, sort_by: sortBy });
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = (postId) => {
    setOpenComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleCommentsSection = toggleComments;

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value
    }));
  };


  const handleOpenComposer = async () => {
    setIsComposerOpen(true);
    if (trips.length === 0) {
      Promise.all([
        listTrips({ owner: 'me' }),
        getActivities()
      ]).then(([t, a]) => {
        setTrips(Array.isArray(t) ? t : []);
        setActivities(Array.isArray(a) ? a : a.items || []);
      }).catch(console.error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;
    setPosting(true);
    try {
      const payload = { ...newPost };
      if (!payload.activity_id) delete payload.activity_id;
      if (!payload.trip_id) delete payload.trip_id;
      if (!payload.image_url) delete payload.image_url;

      await createPost(payload);
      setIsComposerOpen(false);
      setNewPost({ content: '', image_url: '', activity_id: '', trip_id: '' });
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert('Failed to post: ' + (err.message || 'Error'));
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    // Optimistic UI update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const nextLiked = !p.is_liked;
        return {
          ...p,
          is_liked: nextLiked,
          likes_count: nextLiked ? (p.likes_count || 0) + 1 : Math.max((p.likes_count || 0) - 1, 0)
        };
      }
      return p;
    }));

    try {
      const res = await toggleLikePost(postId);
      if (res && res.likes_count !== undefined) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked: res.is_liked, likes_count: res.likes_count } : p));
      }
    } catch (err) {
      console.error(err);
      fetchPosts();
    }
  };

  const handleCommentSubmit = async (postId, e) => {
    e.preventDefault();
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const newComment = await addComment(postId, { content: text });
      
      // Update comments list on the post immediately and open comments
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), newComment]
          };
        }
        return p;
      }));

      // Ensure comments section is opened
      setOpenComments(prev => ({ ...prev, [postId]: true }));

      // Clear input
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (arg1, arg2) => {
    // Determine commentId vs postId safely
    const commentId = arg1;
    const postId = arg2;
    try {
      await deleteComment(commentId, postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: (p.comments || []).filter(c => c.id !== commentId)
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };


  const getUserInitials = (name) => {
    if (!name) return 'TR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="community-page">
      <div className="container">
        
        <div className="community-header">
          <h1 className="community-title">Travelers Community</h1>
          <p className="community-subtitle">Discover stories, tips, and experiences shared by adventurers worldwide.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="community-bar">
          <div className="community-bar-row">
            <div className="community-search-wrap">
              <Search className="community-search-icon" size={20} />
              <input 
                type="text" 
                className="community-search-input" 
                placeholder="Search posts by stories, tips, destinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select 
              className="community-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        <div className="community-feed">
          {/* Quick Inline Composer */}
          <div className="community-quick-compose">
            <div className="community-quick-compose-top">
              <div className="post-avatar" style={{ width: '40px', height: '40px', fontSize: '0.875rem' }}>
                {user?.photo_url ? (
                  <img src={user.photo_url} alt={user?.first_name || 'You'} className="post-avatar-img" />
                ) : (
                  getUserInitials(user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'You')
                )}
              </div>
              <input 
                type="text"
                className="community-quick-compose-input"
                placeholder="Share a travel story, tip, or memorable moment..."
                onClick={handleOpenComposer}
                readOnly
              />
            </div>
            <div className="community-quick-compose-actions">
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="community-quick-action-btn" onClick={handleOpenComposer}>
                  <ImageIcon size={16} style={{ color: 'var(--color-primary)' }} /> Add Photo
                </button>
                <button type="button" className="community-quick-action-btn" onClick={handleOpenComposer}>
                  <Compass size={16} style={{ color: '#3b82f6' }} /> Tag Trip
                </button>
                <button type="button" className="community-quick-action-btn" onClick={handleOpenComposer}>
                  <MapPin size={16} style={{ color: '#10b981' }} /> Tag Activity
                </button>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenComposer}>
                <Plus size={14} /> Post
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-6">
              {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-xl)' }}></div>)}
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state" style={{ background: 'var(--color-surface)', padding: '48px 24px', borderRadius: 'var(--radius-xl)' }}>
              <MessageCircle size={56} className="empty-state-icon" style={{ color: 'var(--color-primary)' }} />
              <h3 className="empty-state-title">No community posts yet</h3>
              <p className="empty-state-desc">Be the first to share your travel experiences with the community!</p>
              <button className="btn btn-primary" onClick={handleOpenComposer}>Write a Post</button>
            </div>
          ) : (
            posts.map(post => {
              const isCommentsOpen = !!openComments[post.id];
              return (
                <div key={post.id} className="post-card">
                  
                  {/* Post Header */}
                  <div className="post-header">
                    <div className="post-avatar">
                      {post.user_avatar ? (
                        <img src={post.user_avatar} alt={post.user_name} className="post-avatar-img" />
                      ) : (
                        getUserInitials(post.user_name)
                      )}
                    </div>
                    
                    <div className="post-meta">
                      <div className="post-author">{post.user_name || 'Traveler'}</div>
                      <div className="post-time">{new Date(post.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    </div>

                    <div className="post-tags">
                      {post.trip_name && (
                        <span className="badge badge-info" title="Tagged Trip">
                          <Compass size={12} style={{ marginRight: '4px' }} /> {post.trip_name}
                        </span>
                      )}
                      {post.activity_name && (
                        <span className="badge badge-neutral" title="Tagged Activity">
                          <MapPin size={12} style={{ marginRight: '4px' }} /> {post.activity_name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Post Content */}
                  <div className="post-content">
                    {post.content}
                  </div>
                  
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="Post attachment" 
                      className="post-image" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  
                  {/* Post Actions */}
                  <div className="post-actions">
                    <button 
                      className={`post-action-btn ${post.is_liked ? 'liked' : ''}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart size={18} fill={post.is_liked ? 'currentColor' : 'none'} />
                      <span>{post.likes_count || 0}</span>
                    </button>
                    
                    <button 
                      className={`post-action-btn ${isCommentsOpen ? 'active' : ''}`}
                      onClick={() => toggleCommentsSection(post.id)}
                    >
                      <MessageCircle size={18} />
                      <span>{post.comments?.length || 0} Comments</span>
                      {isCommentsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  
                  {/* Expandable Comment Section */}
                  {isCommentsOpen && (
                    <div className="post-comments-container">
                      
                      {/* Comments List */}
                      <div className="post-comments-list">
                        {post.comments && post.comments.length > 0 ? (
                          post.comments.map(comment => {
                            const isAuthor = user && (user.id === comment.user_id || user.username === comment.user_name);
                            return (
                              <div key={comment.id} className="post-comment-item">
                                <div className="post-comment-avatar">
                                  {comment.user_avatar ? (
                                    <img src={comment.user_avatar} alt={comment.user_name} className="post-avatar-img" />
                                  ) : (
                                    getUserInitials(comment.user_name)
                                  )}
                                </div>
                                <div className="post-comment-body">
                                  <div className="post-comment-bubble">
                                    <div className="post-comment-author-row">
                                      <span className="post-comment-author">{comment.user_name || 'Traveler'}</span>
                                      <span className="post-comment-time">
                                        {comment.created_at ? new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                      </span>
                                      {isAuthor && (
                                        <button 
                                          className="post-comment-delete-btn" 
                                          title="Delete comment"
                                          onClick={() => handleDeleteComment(comment.id, post.id)}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </div>
                                    <div className="post-comment-text">{comment.content}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-3)', fontSize: '0.875rem' }}>
                            No comments yet. Be the first to join the conversation!
                          </div>
                        )}
                      </div>
                      
                      {/* Comment Input */}
                      <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="post-comment-form">
                        <input 
                          type="text" 
                          className="post-comment-input" 
                          placeholder="Write a supportive comment or tip..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                          disabled={submittingComment[post.id]}
                        />
                        <button 
                          type="submit" 
                          className="post-comment-submit"
                          disabled={submittingComment[post.id] || !(commentInputs[post.id] || '').trim()}
                        >
                          <Send size={16} />
                        </button>
                      </form>

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Floating Compose Button */}
      <button className="community-compose-btn" onClick={handleOpenComposer}>
        <Plus size={20} /> Share a Story
      </button>

      {/* Upgraded Composer Modal */}
      {isComposerOpen && (
        <div className="modal-overlay" onClick={() => setIsComposerOpen(false)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={20} style={{ color: 'var(--color-primary)' }}/> 
                  Create Community Post
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)', margin: '2px 0 0' }}>
                  Share your travels, tips, and hidden gems with fellow explorers.
                </p>
              </div>
              <button className="builder-section-action-btn" onClick={() => setIsComposerOpen(false)}>
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* User Header Strip */}
                <div className="composer-user-strip">
                  <div className="post-avatar" style={{ width: '38px', height: '38px', fontSize: '0.875rem' }}>
                    {user?.photo_url ? (
                      <img src={user.photo_url} alt={user?.first_name || 'You'} className="post-avatar-img" />
                    ) : (
                      getUserInitials(user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'You')
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'Traveler'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                      Posting publicly to GlobeTrotter Community
                    </div>
                  </div>
                </div>

                {/* Textarea */}
                <div style={{ position: 'relative' }}>
                  <textarea 
                    className="composer-textarea"
                    placeholder="What did you discover? Share stories, advice, route tips, or food spots..."
                    value={newPost.content}
                    onChange={e => setNewPost({...newPost, content: e.target.value})}
                    autoFocus
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {newPost.content.length} characters
                  </div>
                </div>

                {/* Image URL Input */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    Photo URL (Optional)
                  </label>
                  <div className="composer-image-input-wrap">
                    <ImageIcon size={18} className="community-image-icon" />
                    <input 
                      type="url" 
                      className="composer-image-input" 
                      placeholder="Paste image link: https://images.unsplash.com/..."
                      value={newPost.image_url}
                      onChange={e => setNewPost({...newPost, image_url: e.target.value})}
                    />
                  </div>
                </div>

                {/* Live Image Preview */}
                {newPost.image_url && (
                  <div className="composer-image-preview">
                    <img 
                      src={newPost.image_url} 
                      alt="Preview attachment" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <button 
                      type="button" 
                      className="composer-image-remove-btn"
                      onClick={() => setNewPost({ ...newPost, image_url: '' })}
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Tag Trip and Activity */}
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      <Compass size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Tag a Trip (Optional)
                    </label>
                    <select 
                      className="composer-select"
                      value={newPost.trip_id}
                      onChange={e => setNewPost({...newPost, trip_id: e.target.value, activity_id: ''})}
                    >
                      <option value="">None (General Post)</option>
                      {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      <MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Tag Activity (Optional)
                    </label>
                    <select 
                      className="composer-select"
                      value={newPost.activity_id}
                      onChange={e => setNewPost({...newPost, activity_id: e.target.value, trip_id: ''})}
                    >
                      <option value="">None</option>
                      {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>

              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsComposerOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={posting || !newPost.content.trim()}>
                  {posting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Publishing...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Post to Community
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
