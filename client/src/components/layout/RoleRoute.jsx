import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import { LoadingSpinner } from '../feedback/LoadingSpinner.jsx';

/**
 * Route wrapper that restricts access based on user role (PATIENT vs DOCTOR).
 */
export function RoleRoute({ allowedRole, redirectPath = '/dashboard', children }) {
  const { role, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" label="Checking permissions..." />
      </div>
    );
  }

  if (!isAuthenticated || role !== allowedRole) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? children : <Outlet />;
}
