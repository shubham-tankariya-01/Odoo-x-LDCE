import React, { useState, useEffect } from 'react';
import { listPosts, toggleLikePost, addComment, getMe, getActivities, listTrips, createPost } from '../api/client';
import { MessageCircle, Heart, Search, Filter, Image as ImageIcon, Send, X } from 'lucide-react';
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

  useEffect(() => {
    fetchPosts();
  }, [search, sortBy]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await listPosts({ search, sort_by: sortBy });
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenComposer = async () => {
    setIsComposerOpen(true);
    if (trips.length === 0) {
      // Load context options for tagging
      Promise.all([
        listTrips({ owner: 'me' }),
        getActivities()
      ]).then(([t, a]) => {
        setTrips(t);
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
      alert('Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await toggleLikePost(postId);
      // Optimistic update would be better, but refetching is simple
      // Ideally we should know if user liked it, but schema doesn't return it yet.
      // Just visually toggling or refetching. Let's just refetch.
      fetchPosts(); 
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId, e) => {
    e.preventDefault();
    const form = e.target;
    const content = form.comment.value;
    if (!content.trim()) return;
    
    try {
      await addComment(postId, { content });
      form.reset();
      // Refetch to see new comment counts (if schema supported it), 
      // but standard schema from guide just adds it. We'll alert for now since UI doesn't show comments tree.
      alert('Comment added! (UI does not display comment threads yet)');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-wrapper bg-surface-2" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
        
        <div className="page-header mb-6">
          <h1 className="page-title">Community Feed</h1>
          <p className="page-subtitle">Discover experiences, tips, and photos from other travelers.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="search-filter-bar mb-6">
          <div className="search-filter-input-wrap">
            <Search className="navbar-search-icon" size={16} />
            <input 
              type="text" 
              className="search-filter-input border-none bg-surface" 
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="search-filter-select border-none bg-surface"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Popular</option>
          </select>
          <button className="btn btn-primary" onClick={handleOpenComposer}>
            <ImageIcon size={16} /> Share Experience
          </button>
        </div>

        <div className="max-w-[700px] mx-auto">
          {loading ? (
            <div className="flex flex-col gap-6">
              {[1, 2].map(i => <div key={i} className="skeleton skeleton-card h-80"></div>)}
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state bg-surface border border-border rounded-md mt-6">
              <MessageCircle className="empty-state-icon" />
              <h3 className="empty-state-title">No community posts yet</h3>
              <p className="empty-state-desc">Be the first to share your travel experiences with the community!</p>
              <button className="btn btn-primary mt-4" onClick={handleOpenComposer}>Write a Post</button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {posts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-card-header">
                    <div className="post-avatar">
                      {/* Would use actual username/avatar if included in PostRead schema */}
                      <span className="uppercase">{post.user_id.substring(0, 2)}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-text text-sm">User {post.user_id.substring(0, 8)}...</div>
                      <div className="text-xs text-muted">{new Date(post.created_at).toLocaleString()}</div>
                    </div>
                    {(post.trip_id || post.activity_id) && (
                      <div className="ml-auto hide-mobile">
                        <span className="badge badge-primary">Tagged {post.trip_id ? 'Trip' : 'Activity'}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-base text-text mb-4 whitespace-pre-wrap">
                    {post.content}
                  </div>
                  
                  {post.image_url && (
                    <img src={post.image_url} alt="Post attachment" className="post-card-img" />
                  )}
                  
                  <div className="post-actions">
                    <button className="btn-ghost flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors" onClick={() => handleLike(post.id)}>
                      <Heart size={18} /> Like
                    </button>
                    {/* Simplified comment toggle */}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <form onSubmit={(e) => handleComment(post.id, e)} className="flex items-center gap-3">
                      <div className="post-avatar w-8 h-8 text-xs">{user.first_name?.[0] || 'U'}</div>
                      <input 
                        type="text" 
                        name="comment"
                        className="input flex-1 bg-surface-2 border-transparent h-10 py-0" 
                        placeholder="Write a comment..." 
                      />
                      <button type="submit" className="btn btn-ghost text-primary p-2 h-10 w-10 flex items-center justify-center rounded-full bg-primary-muted hover:bg-primary hover:text-white transition-colors">
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Composer Modal */}
      {isComposerOpen && (
        <div className="modal-overlay" onClick={() => setIsComposerOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2"><MessageCircle size={20} className="text-primary"/> Create Post</h3>
              <button className="btn-ghost p-1 rounded-full text-muted hover:bg-surface-2" onClick={() => setIsComposerOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreatePost}>
              <div className="modal-body flex flex-col gap-5">
                
                <div>
                  <textarea 
                    className="input w-full border-none bg-surface-2 text-base resize-none focus:box-shadow-none"
                    placeholder="Share your travel experiences, tips, or photos..."
                    rows={4}
                    value={newPost.content}
                    onChange={e => setNewPost({...newPost, content: e.target.value})}
                    autoFocus
                  ></textarea>
                </div>

                <div className="input-group">
                  <label className="input-label text-xs">Image URL (Optional)</label>
                  <div className="relative">
                    <ImageIcon size={14} className="absolute text-muted" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="url" 
                      className="input py-2 pl-8 text-sm" 
                      placeholder="https://images.unsplash.com/..."
                      value={newPost.image_url}
                      onChange={e => setNewPost({...newPost, image_url: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid-2 gap-4 bg-surface-2 p-3 rounded-md border border-border">
                  <div className="input-group">
                    <label className="input-label text-xs font-semibold">Tag a Trip</label>
                    <select 
                      className="input text-sm py-2"
                      value={newPost.trip_id}
                      onChange={e => setNewPost({...newPost, trip_id: e.target.value, activity_id: ''})} // Mutual exclusion makes sense, though schema allows both
                    >
                      <option value="">None</option>
                      {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label text-xs font-semibold">Tag an Activity</label>
                    <select 
                      className="input text-sm py-2"
                      value={newPost.activity_id}
                      onChange={e => setNewPost({...newPost, activity_id: e.target.value, trip_id: ''})}
                    >
                      <option value="">None</option>
                      {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>

              </div>
              <div className="modal-footer bg-surface-2">
                <button type="button" className="btn btn-ghost" onClick={() => setIsComposerOpen(false)}>Cancel</button>
                <button type="submit" className={`btn btn-primary ${posting ? 'btn-loading' : ''}`} disabled={posting || !newPost.content.trim()}>
                  {posting ? 'Posting...' : 'Post to Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
