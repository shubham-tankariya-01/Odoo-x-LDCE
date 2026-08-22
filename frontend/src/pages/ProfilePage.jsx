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
      setPreplannedTrips(pre.slice(0, 3)); 
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
    <div className="profile-page">
      <div className="container">
        
        <div className="profile-layout">
          
          {/* Profile Sidebar */}
          <div className="profile-sidebar">
            <div 
              className="profile-avatar"
              style={{ backgroundImage: user.profile_photo_url ? `url(${user.profile_photo_url})` : 'none' }}
            >
              {!user.profile_photo_url && (user.first_name?.[0] || <User size={48} />)}
            </div>
            <h2 className="profile-name">{user.first_name} {user.last_name}</h2>
            <p className="profile-username">@{user.username}</p>
            
            <div className="profile-divider"></div>
            
            <div className="profile-info-list">
              <div className="profile-info-item">
                <Mail size={16} /> <span>{user.email}</span>
              </div>
              {user.phone_number && (
                <div className="profile-info-item">
                  <Phone size={16} /> <span>{user.phone_number}</span>
                </div>
              )}
              {(user.city || user.country) && (
                <div className="profile-info-item">
                  <MapPin size={16} /> <span>{user.city}{user.city && user.country ? ', ' : ''}{user.country}</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="profile-main">
            
            {/* Edit Profile Form */}
            <div className="profile-details-card">
              <div className="profile-details-header">
                <h3 className="profile-details-title">Profile Details</h3>
                {!isEditing ? (
                  <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
                    <Edit2 size={16} /> Edit Profile
                  </button>
                ) : (
                  <button className="profile-cancel-btn" onClick={() => { setIsEditing(false); setError(''); }}>
                    <X size={16} /> Cancel
                  </button>
                )}
              </div>

              {error && (
                <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)' }}>
                  {error}
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="profile-form-row">
                    <div className="profile-form-field">
                      <label>First Name</label>
                      <input type="text" name="first_name" className="profile-form-input" value={formData.first_name} onChange={handleChange} required />
                    </div>
                    <div className="profile-form-field">
                      <label>Last Name</label>
                      <input type="text" name="last_name" className="profile-form-input" value={formData.last_name} onChange={handleChange} required />
                    </div>
                  </div>
                  
                  <div className="profile-form-row">
                    <div className="profile-form-field">
                      <label>Phone Number</label>
                      <input type="tel" name="phone_number" className="profile-form-input" value={formData.phone_number} onChange={handleChange} />
                    </div>
                    <div className="profile-form-field">
                      <label>Email <span style={{ opacity: 0.5 }}>(Read Only)</span></label>
                      <input type="email" className="profile-form-input" value={user.email} disabled />
                    </div>
                  </div>

                  <div className="profile-form-row">
                    <div className="profile-form-field">
                      <label>City</label>
                      <input type="text" name="city" className="profile-form-input" value={formData.city} onChange={handleChange} />
                    </div>
                    <div className="profile-form-field">
                      <label>Country</label>
                      <input type="text" name="country" className="profile-form-input" value={formData.country} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="profile-form-field">
                    <label>Bio / Additional Info</label>
                    <textarea name="additional_info" className="profile-form-input" value={formData.additional_info} onChange={handleChange}></textarea>
                  </div>

                  <div className="profile-form-actions">
                    <button type="submit" className="profile-save-btn" disabled={loading}>
                      <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={`profile-bio ${!user.additional_info ? 'empty' : ''}`}>
                  {user.additional_info ? (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{user.additional_info}</span>
                  ) : (
                    "No bio added yet. Click edit to tell the world about your travels!"
                  )}
                </div>
              )}
            </div>

            <div className="profile-trips-grid">
              
              {/* Preplanned Trips Mini-list */}
              <div className="profile-trip-panel">
                <div className="profile-trip-panel-header">
                  <h3 className="profile-trip-panel-title">Upcoming</h3>
                  <Link to="/trips" className="profile-trip-panel-link">View all <ArrowRight size={14}/></Link>
                </div>
                <div className="profile-trip-panel-body">
                  {loadingTrips ? (
                    <div className="skeleton" style={{ height: '48px', borderRadius: 'var(--radius-md)' }}></div>
                  ) : preplannedTrips.length > 0 ? (
                    <div className="profile-trip-list">
                      {preplannedTrips.map(trip => (
                        <Link key={trip.id} to={`/trips/${trip.id}`} className="profile-trip-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div className="profile-trip-item-name">{trip.name}</div>
                          <div className="profile-trip-item-date"><Calendar size={12}/> {new Date(trip.start_date).toLocaleDateString()}</div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="profile-trip-empty">No upcoming trips planned.</div>
                  )}
                </div>
              </div>

              {/* Previous Trips Mini-list */}
              <div className="profile-trip-panel">
                <div className="profile-trip-panel-header">
                  <h3 className="profile-trip-panel-title">Previous</h3>
                  <Link to="/trips" className="profile-trip-panel-link">View all <ArrowRight size={14}/></Link>
                </div>
                <div className="profile-trip-panel-body">
                  {loadingTrips ? (
                    <div className="skeleton" style={{ height: '48px', borderRadius: 'var(--radius-md)' }}></div>
                  ) : previousTrips.length > 0 ? (
                    <div className="profile-trip-list">
                      {previousTrips.map(trip => (
                        <Link key={trip.id} to={`/trips/${trip.id}`} className="profile-trip-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div className="profile-trip-item-name">{trip.name}</div>
                          <div className="profile-trip-item-date"><Calendar size={12}/> {new Date(trip.start_date).toLocaleDateString()}</div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="profile-trip-empty">No past trips found.</div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
