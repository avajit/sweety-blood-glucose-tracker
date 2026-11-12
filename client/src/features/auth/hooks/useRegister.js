import { useAuth } from '../context/AuthContext.jsx';

/**
 * Hook exposing register action and state.
 */
export function useRegister() {
  const { register, isRegistering } = useAuth();
  return {
    register,
    isRegistering,
  };
}
