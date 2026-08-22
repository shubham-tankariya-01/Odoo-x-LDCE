import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, register as apiRegister } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for custom 401 expiration events from api/client.js
    const handleExpired = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getMe();
        setUser(userData);
      } catch (err) {
        console.error('Failed to load user session:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (username, password) => {
    const data = await apiLogin(username, password);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    // user will be loaded by the useEffect
  };

  const register = async (payload) => {
    const userData = await apiRegister(payload);
    // Standard register doesn't return token in many APIs, but GlobeTrotter docs 
    // say "Create user account". If it doesn't return a token, we might need to 
    // login immediately after. Assuming it returns token or we login after.
    // Actually, looking at standard FastAPI setups, register often returns the user.
    // Let's do a login right after register to get the token.
    if (userData && payload.password) {
      await login(payload.username || payload.email, payload.password);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    setUser // For profile updates
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
