import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ requireAdmin = false }) {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
