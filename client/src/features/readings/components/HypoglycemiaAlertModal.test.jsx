import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HypoglycemiaAlertModal } from './HypoglycemiaAlertModal.jsx';

describe('HypoglycemiaAlertModal Component (Phase 2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <HypoglycemiaAlertModal value={50} isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders Level 1 Mild Low alert when value is between 55 and 69', () => {
    render(<HypoglycemiaAlertModal value={65} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Low Blood Glucose: 65 mg\/dL \(Level 1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ADA Rule of 15 Emergency Protocol/i)).toBeInTheDocument();
    expect(screen.getByText('15:00')).toBeInTheDocument();
  });

  it('renders Level 2 Critical Low alert and emergency notice when value <= 54', () => {
    render(<HypoglycemiaAlertModal value={48} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Critical Low: 48 mg\/dL \(Level 2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Medical Emergency:/i)).toBeInTheDocument();
  });

  it('starts countdown timer when Start Timer button is clicked', () => {
    render(<HypoglycemiaAlertModal value={60} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('15:00')).toBeInTheDocument();

    const startBtn = screen.getByRole('button', { name: /start timer/i });
    fireEvent.click(startBtn);

    act(() => {
      vi.advanceTimersByTime(3000); // 3 seconds forward
    });

    expect(screen.getByText('14:57')).toBeInTheDocument();
  });

  it('calls onClose when acknowledge button is clicked', () => {
    const handleClose = vi.fn();
    render(<HypoglycemiaAlertModal value={58} isOpen={true} onClose={handleClose} />);

    const ackButton = screen.getByRole('button', { name: /I Have Consumed 15g Carbs \/ Acknowledge/i });
    fireEvent.click(ackButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

