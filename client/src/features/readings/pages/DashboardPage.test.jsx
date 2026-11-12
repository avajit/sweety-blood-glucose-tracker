import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import DashboardPage from './DashboardPage.jsx';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import * as useReadingsHook from '../hooks/useReadings.js';

describe('DashboardPage', () => {
  it('shows the empty-state message when the readings list is empty', () => {
    vi.spyOn(useReadingsHook, 'useReadings').mockReturnValue({
      data: { data: [], pagination: { total: 0 } },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText(/no glucose readings logged/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 4/i)).toBeInTheDocument();
  });
});

