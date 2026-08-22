import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, AlertCircle, Camera } from 'lucide-react';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    city: '',
    country: '',
    additional_info: ''
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    
    try {
      await register(formData);
      // Assuming register logs them in or we just navigate to login
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-side" style={{ order: 2 }}>
        <div style={{ maxWidth: '500px', width: '100%', margin: '0 auto' }}>
          <div className="auth-logo">
            <div className="navbar-logo-icon">
              <Compass size={24} />
            </div>
            GlobeTrotter
          </div>
          
          <h2 className="auth-title">Create an account</h2>
          <p className="auth-subtitle">Join us to start planning your perfect trips.</p>
          
          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
              <div className="relative">
                <div 
                  className="navbar-avatar" 
                  style={{ width: '80px', height: '80px', fontSize: 'var(--text-2xl)', background: photoPreview ? 'transparent' : 'var(--color-surface-2)', color: 'var(--color-text-3)' }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={32} />
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  title="Upload photo"
                />
              </div>
            </div>

            <div className="grid-2 gap-4">
              <div className="input-group">
                <label className="input-label" htmlFor="first_name">First Name <span className="required">*</span></label>
                <input id="first_name" name="first_name" type="text" className="input" value={formData.first_name} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="last_name">Last Name <span className="required">*</span></label>
                <input id="last_name" name="last_name" type="text" className="input" value={formData.last_name} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="username">Username <span className="required">*</span></label>
              <input id="username" name="username" type="text" className="input" value={formData.username} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="email">Email <span className="required">*</span></label>
              <input id="email" name="email" type="email" className="input" value={formData.email} onChange={handleChange} required />
            </div>
            
            <div className="input-group">
              <label className="input-label" htmlFor="password">Password <span className="required">*</span></label>
              <input id="password" name="password" type="password" className="input" placeholder="Min. 6 characters" value={formData.password} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="phone_number">Phone Number</label>
              <input id="phone_number" name="phone_number" type="tel" className="input" value={formData.phone_number} onChange={handleChange} />
            </div>

            <div className="grid-2 gap-4">
              <div className="input-group">
                <label className="input-label" htmlFor="city">City</label>
                <input id="city" name="city" type="text" className="input" value={formData.city} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="country">Country</label>
                <input id="country" name="country" type="text" className="input" value={formData.country} onChange={handleChange} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="additional_info">Bio / Additional Info</label>
              <textarea id="additional_info" name="additional_info" className="input" style={{ minHeight: '80px', paddingTop: '10px' }} value={formData.additional_info} onChange={handleChange} />
            </div>
            
            <button 
              type="submit" 
              className={`btn btn-primary btn-lg w-full ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          
          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>

      <div className="auth-hero" style={{ order: 1 }}>
        <img 
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
          alt="Travel beach" 
          className="auth-hero-img"
        />
        <div className="auth-hero-content">
          <h1 className="auth-hero-title">Start your journey.</h1>
          <p className="auth-hero-subtitle">Create itineraries, manage budgets, and discover new destinations.</p>
        </div>
      </div>
    </div>
  );
}
