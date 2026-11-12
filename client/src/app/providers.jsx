import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient.js';
import { AuthProvider } from '../features/auth/context/AuthContext.jsx';

/**
 * Root providers wrapper.
 * Combines TanStack QueryClient and AuthProvider.
 */
export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
