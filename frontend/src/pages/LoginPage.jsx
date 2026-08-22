import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(formData.username, formData.password);
      // Redirect to where they were trying to go, or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <img 
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
          alt="Travel landscape" 
          className="auth-hero-img"
        />
        <div className="auth-hero-content">
          <h1 className="auth-hero-title">Discover the world's best kept secrets.</h1>
          <p className="auth-hero-subtitle">Join GlobeTrotter to plan, share, and experience travel like never before.</p>
        </div>
      </div>
      
      <div className="auth-form-side">
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <div className="auth-logo">
            <div className="navbar-logo-icon">
              <Compass size={24} />
            </div>
            GlobeTrotter
          </div>
          
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Please enter your details to sign in.</p>
          
          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="username">Username or Email <span className="required">*</span></label>
              <input 
                id="username"
                name="username"
                type="text" 
                className="input" 
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="input-group">
              <label className="input-label" htmlFor="password">Password <span className="required">*</span></label>
              <input 
                id="password"
                name="password"
                type="password" 
                className="input" 
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className={`btn btn-primary btn-lg w-full ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          
          <div className="auth-switch">
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
