import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Compass, Sun, Moon, LogOut, User as UserIcon, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null; // Don't show navbar on login/register

  const navLinks = [
    { name: 'Discover', path: '/' },
    { name: 'My Trips', path: '/trips' },
    { name: 'Community', path: '/community' },
    { name: 'Calendar', path: '/calendar' },
  ];

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <Compass size={20} />
          </div>
          <span className="hide-mobile">GlobeTrotter</span>
        </Link>

        <form className="navbar-search hide-mobile" onSubmit={handleSearch}>
          <Search className="navbar-search-icon" size={16} />
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search cities, activities, or trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="navbar-nav">
          <div className="hide-mobile" style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <button 
            className="btn-ghost rounded-full" 
            style={{ padding: '8px' }}
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative">
            <div 
              className="navbar-avatar" 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              {user.first_name ? user.first_name[0].toUpperCase() : <UserIcon size={16} />}
            </div>

            {isProfileOpen && (
              <div className="navbar-dropdown">
                <Link to="/profile" className="navbar-dropdown-item">
                  <UserIcon size={16} /> Profile
                </Link>
                {user.is_admin && (
                  <Link to="/admin" className="navbar-dropdown-item">
                    <Shield size={16} /> Admin Panel
                  </Link>
                )}
                <div className="navbar-dropdown-divider"></div>
                <button onClick={handleLogout} className="navbar-dropdown-item danger">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>

          <button 
            className="show-mobile btn-ghost" 
            style={{ padding: '8px', marginLeft: '8px' }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="show-mobile" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, 
          background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
          padding: '16px', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-md)'
        }}>
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="navbar-search-icon" size={16} />
            <input
              type="text"
              className="navbar-search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
                style={{ width: '100%' }}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
