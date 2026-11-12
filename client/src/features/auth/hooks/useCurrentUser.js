import { useAuth } from '../context/AuthContext.jsx';

/**
 * Hook to retrieve current authenticated user.
 */
export function useCurrentUser() {
  const { user, isAuthenticated, role, isLoading } = useAuth();
  return { user, isAuthenticated, role, isLoading };
}
