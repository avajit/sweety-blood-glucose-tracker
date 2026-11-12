import { useAuth } from '../context/AuthContext.jsx';

/**
 * Hook exposing login action and state.
 */
export function useLogin() {
  const { login, isLoggingIn } = useAuth();
  return {
    login,
    isLoggingIn,
  };
}
