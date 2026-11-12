import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ReportSummary } from './ReportSummary.jsx';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';

describe('ReportSummary', () => {
  it('displays em-dashes or "—" when count === 0', () => {
    const emptyReport = {
      type: 'daily',
      count: 0,
      average: null,
      lowest: null,
      highest: null,
      estimatedA1c: null,
      timeInRange: { total: 0, inRangePct: 0, lowPct: 0, highPct: 0 },
      readings: [],
    };

    renderWithProviders(<ReportSummary report={emptyReport} />);

    // Check that Average, Lowest, Highest, and A1C show em-dashes
    const emDashes = screen.getAllByText('—');
    expect(emDashes.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(/No data in range/i)).toBeInTheDocument();
  });

  it('displays calculated metrics when count > 0', () => {
    const populatedReport = {
      type: 'monthly',
      count: 120,
      average: 115,
      lowest: 74,
      highest: 168,
      estimatedA1c: 5.6,
      timeInRange: {
        total: 120,
        inRangePct: 92.5,
        lowPct: 2.5,
        highPct: 5.0,
      },
      readings: [],
    };

    renderWithProviders(<ReportSummary report={populatedReport} />);

    expect(screen.getByText('115')).toBeInTheDocument();
    expect(screen.getByText('74')).toBeInTheDocument();
    expect(screen.getByText('168')).toBeInTheDocument();
    expect(screen.getByText('5.6%')).toBeInTheDocument();
    expect(screen.getByText('92.5%')).toBeInTheDocument();
  });
});

