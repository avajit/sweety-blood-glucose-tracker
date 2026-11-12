import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { GlucoseChart } from './GlucoseChart.jsx';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';

describe('GlucoseChart', () => {
  it('renders without crashing when passed an empty readings array', () => {
    renderWithProviders(<GlucoseChart readings={[]} />);

    expect(screen.getByText(/Glucose Trend & Target Zone/i)).toBeInTheDocument();
    expect(screen.getByText(/No readings in selected range/i)).toBeInTheDocument();
  });

  it('renders without crashing when passed null or undefined readings', () => {
    renderWithProviders(<GlucoseChart readings={null} />);

    expect(screen.getByText(/No readings in selected range/i)).toBeInTheDocument();
  });

  it('renders trend title and legend when readings are provided', () => {
    const mockReadings = [
      {
        id: 'r1',
        readingDate: '2026-11-10',
        slot: 'MORNING_FASTING',
        value: 110,
      },
      {
        id: 'r2',
        readingDate: '2026-11-10',
        slot: 'AFTER_BREAKFAST',
        value: 145,
      },
    ];

    renderWithProviders(<GlucoseChart readings={mockReadings} />);

    expect(screen.getByText(/Glucose Trend & Target Zone/i)).toBeInTheDocument();
    expect(screen.getByText(/Target \(70–180\)/i)).toBeInTheDocument();
  });
});

