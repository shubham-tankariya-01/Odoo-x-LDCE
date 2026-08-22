import React, { createContext, useState, useEffect } from 'react';
import { getMe } from '../api/users';
import { login as loginApi, register as registerApi } from '../api/auth';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gt_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getMe()
        .then((userData) => setUser(userData))
        .catch(() => {
          setToken(null);
          localStorage.removeItem('gt_token');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  const login = async (username, password) => {
    const response = await loginApi(username, password);
    localStorage.setItem('gt_token', response.access_token);
    setToken(response.access_token);
    setUser(response.user);
  };

  const register = async (payload) => {
    const response = await registerApi(payload);
    localStorage.setItem('gt_token', response.access_token);
    setToken(response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('gt_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
