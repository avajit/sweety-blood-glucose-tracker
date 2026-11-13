import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../api/auth.api.js';
import { queryKeys } from '../../../api/queryKeys.js';

export const AuthContext = createContext(null);

/**
 * Global authentication state provider.
 * Automatically hydrates session on page load using HTTP-only cookie.
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  // Query /me on initial load
  const { data: user, isLoading, isError } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (userData) => {
      queryClient.setQueryData(queryKeys.auth.me, userData);
      queryClient.invalidateQueries({ queryKey: queryKeys.readings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (userData) => {
      queryClient.setQueryData(queryKeys.auth.me, userData);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.me, null);
      queryClient.clear();
    },
  });

  const value = useMemo(
    () => ({
      user: isError ? null : user || null,
      isAuthenticated: Boolean(user && !isError),
      role: user?.role || null,
      isLoading,
      login: loginMutation.mutateAsync,
      register: registerMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
      isLoggingIn: loginMutation.isPending,
      isRegistering: registerMutation.isPending,
      isLoggingOut: logoutMutation.isPending,
    }),
    [user, isLoading, isError, loginMutation, registerMutation, logoutMutation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isAuthenticated: false,
      role: null,
      isLoading: false,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      isLoggingIn: false,
      isRegistering: false,
      isLoggingOut: false,
    };
  }
  return context;
}
