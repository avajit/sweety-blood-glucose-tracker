import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Navbar } from './Navbar.jsx';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';
import * as AuthContextModule from '../../features/auth/context/AuthContext.jsx';
import { createMockUser } from '../../test/factories.js';
import { ROLES } from '@sweety/shared/constants/roles.js';

describe('Navbar', () => {
  it('renders sign in and register buttons when unauthenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    renderWithProviders(<Navbar />);

    expect(screen.getByText('Sweety')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders patient navigation links and profile when authenticated as patient', () => {
    const patient = createMockUser({ name: 'Rahul Sharma', role: ROLES.PATIENT });
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: patient,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    renderWithProviders(<Navbar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Log History')).toBeInTheDocument();
    expect(screen.getByText('Clinical Reports')).toBeInTheDocument();
    expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('renders doctor navigation links and doctor badge when authenticated as doctor', () => {
    const doctor = createMockUser({ name: 'Dr. John Doe', role: ROLES.DOCTOR });
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: doctor,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    renderWithProviders(<Navbar />);

    expect(screen.getByText('My Patients')).toBeInTheDocument();
    expect(screen.getByText('Dr. John Doe')).toBeInTheDocument();
    expect(screen.getByText('Doctor')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});

