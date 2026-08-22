import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateMe, getMyTrips } from '../api/client';
import { User, Mail, Phone, MapPin, Edit2, Save, X, Calendar, ArrowRight } from 'lucide-react';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [preplannedTrips, setPreplannedTrips] = useState([]);
  const [previousTrips, setPreviousTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        city: user.city || '',
        country: user.country || '',
        additional_info: user.additional_info || ''
      });
    }
  }, [user]);

  useEffect(() => {
    Promise.all([
      getMyTrips('preplanned'),
      getMyTrips('previous')
    ])
    .then(([pre, prev]) => {
      setPreplannedTrips(pre.slice(0, 3)); // cap to a handful
      setPreviousTrips(prev.slice(0, 3));
    })
    .catch(console.error)
    .finally(() => setLoadingTrips(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const updatedUser = await updateMe(formData);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page-wrapper bg-surface-2" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-12)' }}>
        
        <div className="grid grid-3 gap-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
          
          {/* Profile Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="card p-6 text-center flex flex-col items-center">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-display font-bold text-white bg-primary shadow-md mb-4"
                style={{ backgroundImage: user.profile_photo_url ? `url(${user.profile_photo_url})` : 'none', backgroundSize: 'cover' }}
              >
                {!user.profile_photo_url && (user.first_name?.[0] || <User size={48} />)}
              </div>
              <h2 className="text-2xl font-display font-semibold text-text">{user.first_name} {user.last_name}</h2>
              <p className="text-muted text-sm mb-4">@{user.username}</p>
              
              <div className="w-full divider my-4"></div>
              
              <div className="w-full flex flex-col gap-3 text-sm text-left">
                <div className="flex items-center gap-3 text-secondary">
                  <Mail size={16} /> <span className="truncate">{user.email}</span>
                </div>
                {user.phone_number && (
                  <div className="flex items-center gap-3 text-secondary">
                    <Phone size={16} /> <span>{user.phone_number}</span>
                  </div>
                )}
                {(user.city || user.country) && (
                  <div className="flex items-center gap-3 text-secondary">
                    <MapPin size={16} /> <span>{user.city}{user.city && user.country ? ', ' : ''}{user.country}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-6">
            
            {/* Edit Profile Form */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-semibold">Profile Details</h3>
                {!isEditing ? (
                  <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
                    <Edit2 size={14} /> Edit Profile
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm text-muted" onClick={() => { setIsEditing(false); setError(''); }}>
                    <X size={16} /> Cancel
                  </button>
                )}
              </div>

              {error && <div className="error-banner">{error}</div>}

              {isEditing ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fade-in">
                  <div className="grid-2 gap-4">
                    <div className="input-group">
                      <label className="input-label">First Name</label>
                      <input type="text" name="first_name" className="input" value={formData.first_name} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Last Name</label>
                      <input type="text" name="last_name" className="input" value={formData.last_name} onChange={handleChange} required />
                    </div>
                  </div>
                  
                  <div className="grid-2 gap-4">
                    <div className="input-group">
                      <label className="input-label">Phone Number</label>
                      <input type="tel" name="phone_number" className="input" value={formData.phone_number} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Email (Read Only)</label>
                      <input type="email" className="input" value={user.email} disabled style={{ backgroundColor: 'var(--color-surface-2)' }} />
                    </div>
                  </div>

                  <div className="grid-2 gap-4">
                    <div className="input-group">
                      <label className="input-label">City</label>
                      <input type="text" name="city" className="input" value={formData.city} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Country</label>
                      <input type="text" name="country" className="input" value={formData.country} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Bio / Additional Info</label>
                    <textarea name="additional_info" className="input py-2" style={{ minHeight: '80px' }} value={formData.additional_info} onChange={handleChange}></textarea>
                  </div>

                  <div className="flex justify-end mt-2 pt-4 border-t border-border">
                    <button type="submit" className={`btn btn-primary ${loading ? 'btn-loading' : ''}`} disabled={loading}>
                      <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-secondary text-sm">
                  {user.additional_info ? (
                    <p className="whitespace-pre-wrap">{user.additional_info}</p>
                  ) : (
                    <p className="italic text-muted">No bio added yet.</p>
                  )}
                </div>
              )}
            </div>

            {/* Preplanned Trips Mini-list */}
            <div className="card p-0">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-xl font-display font-semibold">Upcoming & Preplanned</h3>
                <Link to="/trips" className="btn btn-ghost btn-sm text-primary">View all <ArrowRight size={14}/></Link>
              </div>
              <div className="p-6">
                {loadingTrips ? (
                  <div className="skeleton skeleton-text h-12 w-full mb-2"></div>
                ) : preplannedTrips.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {preplannedTrips.map(trip => (
                      <Link key={trip.id} to={`/trips/${trip.id}`} className="flex items-center justify-between p-3 bg-surface-2 rounded-md hover:bg-surface-3 transition-colors">
                        <div className="font-medium text-text">{trip.name}</div>
                        <div className="text-xs text-secondary flex items-center gap-1"><Calendar size={12}/> {new Date(trip.start_date).toLocaleDateString()}</div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted">No upcoming trips planned.</div>
                )}
              </div>
            </div>

            {/* Previous Trips Mini-list */}
            <div className="card p-0">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-xl font-display font-semibold">Previous Adventures</h3>
                <Link to="/trips" className="btn btn-ghost btn-sm text-primary">View all <ArrowRight size={14}/></Link>
              </div>
              <div className="p-6">
                {loadingTrips ? (
                  <div className="skeleton skeleton-text h-12 w-full mb-2"></div>
                ) : previousTrips.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {previousTrips.map(trip => (
                      <Link key={trip.id} to={`/trips/${trip.id}`} className="flex items-center justify-between p-3 bg-surface-2 rounded-md hover:bg-surface-3 transition-colors">
                        <div className="font-medium text-text">{trip.name}</div>
                        <div className="text-xs text-secondary flex items-center gap-1"><Calendar size={12}/> {new Date(trip.start_date).toLocaleDateString()}</div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted">No past trips found.</div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
