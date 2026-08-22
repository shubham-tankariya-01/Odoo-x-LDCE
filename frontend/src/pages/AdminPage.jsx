import React, { useState, useEffect } from 'react';
import { 
  adminListUsers, 
  adminUpdateUser, 
  adminDeleteUser, 
  adminGetPopularCities, 
  adminGetPopularActivities, 
  adminGetTrends 
} from '../api/client';
import { Shield, Users, MapPin, Activity, TrendingUp, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [trends, setTrends] = useState(null);
  const [popularCities, setPopularCities] = useState([]);
  const [popularActivities, setPopularActivities] = useState([]);
  const [users, setUsers] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [t, c, a, u] = await Promise.all([
        adminGetTrends(),
        adminGetPopularCities(),
        adminGetPopularActivities(),
        adminListUsers(0, 50)
      ]);
      setTrends(t);
      setPopularCities(c);
      setPopularActivities(a);
      setUsers(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, isAdmin) => {
    try {
      await adminUpdateUser(userId, { is_admin: isAdmin });
      setUsers(prev => ({
        ...prev,
        items: prev.items.map(u => u.id === userId ? { ...u, is_admin: isAdmin } : u)
      }));
    } catch (err) {
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await adminDeleteUser(userId);
      setUsers(prev => ({
        ...prev,
        items: prev.items.filter(u => u.id !== userId),
        total: prev.total - 1
      }));
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        
        <div className="admin-header">
          <div className="admin-header-icon">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Platform analytics and user management.</p>
          </div>
        </div>

        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Overview & Analytics
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Manage Users
          </button>
          <button 
            className={`admin-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            Popular Content
          </button>
        </div>

        {loading ? (
          <div className="admin-stats-grid">
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-xl)' }}></div>)}
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && trends && (
              <div>
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="admin-stat-icon primary">
                        <Users size={24} />
                      </div>
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <div className="admin-stat-value">{trends.total_users}</div>
                      <div className="admin-stat-label">Total Users</div>
                    </div>
                  </div>
                  
                  <div className="admin-stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="admin-stat-icon info">
                        <MapPin size={24} />
                      </div>
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <div className="admin-stat-value">{trends.total_trips}</div>
                      <div className="admin-stat-label">Total Trips</div>
                    </div>
                  </div>
                  
                  <div className="admin-stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="admin-stat-icon warning">
                        <Activity size={24} />
                      </div>
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <div className="admin-stat-value">{trends.total_posts}</div>
                      <div className="admin-stat-label">Community Posts</div>
                    </div>
                  </div>
                  
                  <div className="admin-stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="admin-stat-icon success">
                        <Shield size={24} />
                      </div>
                    </div>
                    <div>
                      <div className="admin-stat-value">{users.items.filter(u => u.is_admin).length}</div>
                      <div className="admin-stat-label">Admins Online</div>
                    </div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <h3 className="admin-panel-title"><MapPin size={20} style={{ color: 'var(--color-primary)' }}/> Top Destinations</h3>
                    </div>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {popularCities.slice(0, 5).map((city, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>{idx + 1}.</span>
                            <span style={{ fontWeight: 600 }}>{city.city_name}</span>
                          </div>
                          <span className="badge badge-neutral">{city.section_count} trips</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <h3 className="admin-panel-title"><Activity size={20} style={{ color: 'var(--color-primary)' }}/> Top Activities</h3>
                    </div>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {popularActivities.slice(0, 5).map((act, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>{idx + 1}.</span>
                            <span style={{ fontWeight: 600 }}>{act.activity_name}</span>
                          </div>
                          <span className="badge badge-neutral">{act.selection_count} bookings</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="admin-panel">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Contact</th>
                        <th>Location</th>
                        <th>Role</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.items.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="admin-table-user">
                              <div className="admin-table-avatar">
                                {u.first_name?.[0] || 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>@{u.username}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{u.email}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.phone_number || '-'}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{u.city || '-'}, {u.country || '-'}</div>
                          </td>
                          <td>
                            {u.is_admin ? (
                              <span className="badge badge-danger">Admin</span>
                            ) : (
                              <span className="badge badge-neutral">User</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <select 
                              className={`admin-role-select ${u.is_admin ? 'admin' : ''}`}
                              style={{ marginRight: '8px' }}
                              value={u.is_admin ? "admin" : "user"}
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value === 'admin')}
                            >
                              <option value="user">Make User</option>
                              <option value="admin">Make Admin</option>
                            </select>
                            <button 
                              className="admin-action-btn danger"
                              onClick={() => handleDeleteUser(u.id)}
                              title="Delete User"
                              style={{ verticalAlign: 'middle' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="grid-2">
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h3 className="admin-panel-title"><MapPin size={24} style={{ color: 'var(--color-primary)' }}/> All Popular Cities</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {popularCities.map((city, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-text-2)' }}>
                            {idx + 1}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{city.city_name}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{city.section_count}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Times Visited</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h3 className="admin-panel-title"><Activity size={24} style={{ color: 'var(--color-primary)' }}/> All Popular Activities</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {popularActivities.map((act, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-text-2)' }}>
                            {idx + 1}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{act.activity_name}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{act.selection_count}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bookings</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
