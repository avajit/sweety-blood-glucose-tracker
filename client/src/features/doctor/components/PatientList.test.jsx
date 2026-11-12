import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { PatientList } from './PatientList.jsx';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';

describe('PatientList Component', () => {
  it('renders loading spinner when isLoading is true', () => {
    renderWithProviders(<PatientList isLoading={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error alert when error is provided', () => {
    renderWithProviders(<PatientList error={new Error('Network error')} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/network error/i);
  });

  it('renders empty state when patient list is empty', () => {
    renderWithProviders(<PatientList patients={[]} />);
    expect(screen.getByText(/no linked patients found/i)).toBeInTheDocument();
  });

  it('renders linked patients list with View Reports links', () => {
    const mockPatients = [
      { id: 'p-1', name: 'Alice Smith', email: 'alice@example.com' },
      { id: 'p-2', name: 'Bob Jones', email: 'bob@example.com' },
    ];

    renderWithProviders(<PatientList patients={mockPatients} />);

    expect(screen.getByText(/alice smith/i)).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText(/bob jones/i)).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();

    const reportButtons = screen.getAllByRole('button', { name: /view reports/i });
    expect(reportButtons.length).toBe(2);
  });
});

