import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, AlertCircle } from 'lucide-react';

export function RegisterPage() {
  const { user, token, register } = useAuth();
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && token) {
      navigate('/', { replace: true });
    }
  }, [user, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    
    try {
      await register(formData);
      navigate('/', { replace: true });
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

  return (
    <div className="auth-page py-12">
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Compass size={24} />
          </div>
          <span className="auth-logo-text">GlobeTrotter</span>
        </div>
        
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Join us to start planning your perfect trips.</p>
        
        {error && (
          <div className="auth-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Name row */}
          <div className="auth-form-row">
            <div className="auth-form-field">
              <label htmlFor="first_name">First Name</label>
              <input id="first_name" name="first_name" type="text" className="auth-input" placeholder="John" value={formData.first_name} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="auth-form-field">
              <label htmlFor="last_name">Last Name</label>
              <input id="last_name" name="last_name" type="text" className="auth-input" placeholder="Doe" value={formData.last_name} onChange={handleChange} required disabled={loading} />
            </div>
          </div>

          {/* Username */}
          <div className="auth-form-field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" className="auth-input" placeholder="johndoe" value={formData.username} onChange={handleChange} required disabled={loading} />
          </div>

          {/* Email / Password row */}
          <div className="auth-form-row">
            <div className="auth-form-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="auth-input" placeholder="you@example.com" value={formData.email} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="auth-form-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="auth-input" placeholder="Min. 6 characters" value={formData.password} onChange={handleChange} required disabled={loading} />
            </div>
          </div>

          {/* Phone / City row */}
          <div className="auth-form-row">
            <div className="auth-form-field">
              <label htmlFor="phone_number">Phone</label>
              <input id="phone_number" name="phone_number" type="tel" className="auth-input" placeholder="+1 234 567 8900" value={formData.phone_number} onChange={handleChange} disabled={loading} />
            </div>
            <div className="auth-form-field">
              <label htmlFor="city">City</label>
              <input id="city" name="city" type="text" className="auth-input" placeholder="San Francisco" value={formData.city} onChange={handleChange} disabled={loading} />
            </div>
          </div>

          {/* Country */}
          <div className="auth-form-field">
            <label htmlFor="country">Country</label>
            <input id="country" name="country" type="text" className="auth-input" placeholder="United States" value={formData.country} onChange={handleChange} disabled={loading} />
          </div>

          {/* Bio */}
          <div className="auth-form-field">
            <label htmlFor="additional_info">Bio <span style={{ fontWeight: 'normal', opacity: 0.7 }}>(Optional)</span></label>
            <textarea id="additional_info" name="additional_info" className="auth-input" style={{ resize: 'none' }} rows={3} placeholder="Tell us about yourself..." value={formData.additional_info} onChange={handleChange} disabled={loading} />
          </div>
          
          <button 
            type="submit" 
            className="auth-submit-btn mt-2"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
