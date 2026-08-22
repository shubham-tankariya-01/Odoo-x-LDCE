import React from 'react';
import { Navbar } from './Navbar';
import { useAuth } from '../../hooks/useAuth';

export function AppShell({ children }) {
  const { user } = useAuth();
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {user && <Navbar />}
      <main style={{ 
        flex: 1, 
        width: '100%', 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: 'var(--space-6)' 
      }}>
        {children}
      </main>
    </div>
  );
}
