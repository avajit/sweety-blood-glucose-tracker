import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AppShell } from './AppShell.jsx';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';
import * as AuthContextModule from '../../features/auth/context/AuthContext.jsx';
import { createMockUser } from '../../test/factories.js';

describe('AppShell Layout', () => {
  it('renders navbar, main content, and footer successfully', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: createMockUser(),
      isAuthenticated: true,
      logout: vi.fn(),
    });

    renderWithProviders(
      <AppShell>
        <div data-testid="test-content">Dashboard Content</div>
      </AppShell>,
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText(/Sweety Blood Glucose Tracker/i)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });
});

