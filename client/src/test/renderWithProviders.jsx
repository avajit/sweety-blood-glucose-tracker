import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

/**
 * Test utility rendering React components inside isolated QueryClient and MemoryRouter contexts.
 *
 * @param {React.ReactElement} ui
 * @param {object} [options]
 * @param {string[]} [options.initialEntries] - Initial router paths
 * @param {QueryClient} [options.queryClient]
 * @returns {import('@testing-library/react').RenderResult}
 */
export function renderWithProviders(ui, { initialEntries = ['/'], queryClient: customClient, ...options } = {}) {
  const queryClient =
    customClient ||
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

/**
 * Creates an isolated QueryClient and React wrapper for testing custom hooks.
 */
export function createTestQueryClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}
