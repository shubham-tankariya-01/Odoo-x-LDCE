import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Search, User, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (!user) return null;

  return (
    <header style={{ 
      borderBottom: '1px solid var(--color-border)', 
      backgroundColor: 'var(--color-bg-surface)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: 'var(--space-4) var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-6)'
      }}>
        <Link to="/" style={{ fontSize: 'var(--text-xl)', fontWeight: '700', color: 'var(--color-text-primary)' }}>
          GlobeTrotter
        </Link>
        
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search cities, activities, or trips..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-page)',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.border = '2px solid var(--color-border-strong)'}
            onBlur={(e) => e.target.style.border = '1px solid var(--color-border)'}
          />
        </form>
        
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-bg-surface-alt)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontWeight: '600'
            }}
          >
            {user.photo_url ? (
              <img src={user.photo_url} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-full)', objectFit: 'cover' }} />
            ) : (
              user.first_name ? user.first_name[0] : <User size={20} />
            )}
          </button>
          
          {isMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 'var(--space-2)',
              backgroundColor: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--color-border)',
              minWidth: '200px',
              overflow: 'hidden'
            }}>
              <Link 
                to="/profile" 
                onClick={() => setIsMenuOpen(false)}
                style={{ display: 'block', padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-primary)' }}
              >
                Profile
              </Link>
              {user.is_admin && (
                <Link 
                  to="/admin" 
                  onClick={() => setIsMenuOpen(false)}
                  style={{ display: 'block', padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-primary)' }}
                >
                  Admin Panel
                </Link>
              )}
              <button 
                onClick={() => { logout(); setIsMenuOpen(false); }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-2)',
                  width: '100%', 
                  textAlign: 'left', 
                  padding: 'var(--space-3) var(--space-4)', 
                  border: 'none', 
                  background: 'none', 
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  borderTop: '1px solid var(--color-border)'
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
