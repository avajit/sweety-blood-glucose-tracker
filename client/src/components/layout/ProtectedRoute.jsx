import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import { LoadingSpinner } from '../feedback/LoadingSpinner.jsx';

/**
 * Route wrapper that ensures only authenticated users can access child routes.
 * Redirects unauthenticated visitors to /login, saving their intended destination.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" label="Hydrating secure session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
