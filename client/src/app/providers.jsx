import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient.js';
import { AuthProvider } from '../features/auth/context/AuthContext.jsx';
import { ToastProvider } from '../components/feedback/ToastContext.jsx';

/**
 * Root providers wrapper.
 * Combines TanStack QueryClient, ToastProvider, and AuthProvider.
 * Fixed Light Theme is enforced across the application.
 */
export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
