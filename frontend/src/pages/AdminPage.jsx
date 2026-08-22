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
    <div className="page-wrapper bg-surface-2" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
        
        <div className="page-header mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-md bg-danger-bg text-danger flex items-center justify-center">
              <Shield size={24} />
            </div>
            <h1 className="page-title mb-0">Admin Dashboard</h1>
          </div>
          <p className="page-subtitle ml-13">Platform analytics and user management.</p>
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
          <div className="grid-3 gap-6">
            <div className="skeleton skeleton-card h-32"></div>
            <div className="skeleton skeleton-card h-32"></div>
            <div className="skeleton skeleton-card h-32"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && trends && (
              <div className="animate-fade-in">
                <div className="grid-3 gap-6 mb-8">
                  <div className="stat-card">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary-muted text-primary flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      <TrendingUp size={16} className="text-success" />
                    </div>
                    <div className="stat-value">{trends.total_users}</div>
                    <div className="stat-label">Total Registered Users</div>
                  </div>
                  <div className="stat-card">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-10 h-10 rounded-full bg-info-bg text-info flex items-center justify-center">
                        <MapPin size={20} />
                      </div>
                      <TrendingUp size={16} className="text-success" />
                    </div>
                    <div className="stat-value">{trends.total_trips}</div>
                    <div className="stat-label">Total Trips Created</div>
                  </div>
                  <div className="stat-card">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-10 h-10 rounded-full bg-warning-bg text-warning flex items-center justify-center">
                        <Activity size={20} />
                      </div>
                      <TrendingUp size={16} className="text-success" />
                    </div>
                    <div className="stat-value">{trends.total_posts}</div>
                    <div className="stat-label">Community Posts</div>
                  </div>
                </div>

                <div className="grid-2 gap-8">
                  <div className="card p-6">
                    <h3 className="text-lg font-display font-semibold mb-4 border-b border-border pb-2 flex items-center gap-2">
                      <MapPin size={18} className="text-primary"/> Top Destinations
                    </h3>
                    <div className="flex flex-col gap-3">
                      {popularCities.slice(0, 5).map((city, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-muted font-mono font-medium w-4">{idx + 1}.</span>
                            <span className="font-medium text-text">{city.city_name}</span>
                          </div>
                          <span className="badge badge-neutral">{city.section_count} trips</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card p-6">
                    <h3 className="text-lg font-display font-semibold mb-4 border-b border-border pb-2 flex items-center gap-2">
                      <Activity size={18} className="text-primary"/> Top Activities
                    </h3>
                    <div className="flex flex-col gap-3">
                      {popularActivities.slice(0, 5).map((act, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-muted font-mono font-medium w-4">{idx + 1}.</span>
                            <span className="font-medium text-text">{act.activity_name}</span>
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
              <div className="card p-0 animate-fade-in overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-surface-2 border-b border-border">
                      <th className="py-3 px-6 text-sm font-semibold text-secondary">User</th>
                      <th className="py-3 px-6 text-sm font-semibold text-secondary">Contact</th>
                      <th className="py-3 px-6 text-sm font-semibold text-secondary">Location</th>
                      <th className="py-3 px-6 text-sm font-semibold text-secondary">Role</th>
                      <th className="py-3 px-6 text-sm font-semibold text-secondary text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.items.map(u => (
                      <tr key={u.id} className="border-b border-border hover:bg-surface-2 transition-colors">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-muted text-primary flex items-center justify-center text-xs font-bold">
                              {u.first_name?.[0] || 'U'}
                            </div>
                            <div>
                              <div className="font-medium text-text">{u.first_name} {u.last_name}</div>
                              <div className="text-xs text-muted">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="text-sm">{u.email}</div>
                          <div className="text-xs text-muted">{u.phone_number || '-'}</div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="text-sm">{u.city || '-'}, {u.country || '-'}</div>
                        </td>
                        <td className="py-3 px-6">
                          {u.is_admin ? (
                            <span className="badge badge-danger">Admin</span>
                          ) : (
                            <span className="badge badge-neutral">User</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <select 
                            className="input p-1 text-xs inline-block w-auto mr-2"
                            value={u.is_admin ? "admin" : "user"}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value === 'admin')}
                          >
                            <option value="user">Make User</option>
                            <option value="admin">Make Admin</option>
                          </select>
                          <button 
                            className="btn btn-ghost p-1 text-danger inline-flex align-middle"
                            onClick={() => handleDeleteUser(u.id)}
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="grid-2 gap-8 animate-fade-in">
                <div className="card p-6">
                  <h3 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
                    <MapPin size={24} className="text-primary"/> All Popular Cities
                  </h3>
                  <div className="flex flex-col divide-y divide-border">
                    {popularCities.map((city, idx) => (
                      <div key={idx} className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center font-mono text-sm text-secondary">
                            {idx + 1}
                          </div>
                          <div className="font-medium text-lg text-text">{city.city_name}</div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-bold text-primary">{city.section_count}</span>
                          <span className="text-xs text-muted uppercase tracking-wider">Times Visited</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
                    <Activity size={24} className="text-primary"/> All Popular Activities
                  </h3>
                  <div className="flex flex-col divide-y divide-border">
                    {popularActivities.map((act, idx) => (
                      <div key={idx} className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center font-mono text-sm text-secondary">
                            {idx + 1}
                          </div>
                          <div className="font-medium text-lg text-text">{act.activity_name}</div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-bold text-primary">{act.selection_count}</span>
                          <span className="text-xs text-muted uppercase tracking-wider">Bookings</span>
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
