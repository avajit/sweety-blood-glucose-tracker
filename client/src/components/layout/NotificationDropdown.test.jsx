import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NotificationDropdown } from './NotificationDropdown.jsx';
import * as authContext from '../../features/auth/context/AuthContext.jsx';
import * as useReadingsHook from '../../features/readings/hooks/useReadings.js';
import * as dateUtils from '@sweety/shared/utils/date.js';
import { ROLES } from '@sweety/shared/constants/roles.js';

describe('NotificationDropdown Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dateUtils, 'todayInTimezone').mockReturnValue('2026-11-13');
  });

  const renderDropdown = () =>
    render(
      <MemoryRouter>
        <NotificationDropdown />
      </MemoryRouter>
    );

  it('does not render anything when user is not authenticated', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
    });
    vi.spyOn(useReadingsHook, 'useReadings').mockReturnValue({ data: { data: [] } });

    const { container } = renderDropdown();
    expect(container.firstChild).toBeNull();
  });

  it('renders bell icon with pending count badge when patient has unlogged meal slots', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: { id: 'p1', name: 'Demo Patient', role: ROLES.PATIENT },
      isAuthenticated: true,
    });
    // 2 readings logged today -> 2 pending
    vi.spyOn(useReadingsHook, 'useReadings').mockReturnValue({
      data: {
        data: [
          { id: '1', readingDate: '2026-11-13T08:00:00Z', slot: 'MORNING_FASTING', value: 95 },
          { id: '2', readingDate: '2026-11-13T13:00:00Z', slot: 'AFTER_LUNCH', value: 115 },
        ],
      },
    });

    renderDropdown();

    const bellBtn = screen.getByRole('button', { name: /view notifications/i });
    expect(bellBtn).toBeInTheDocument();
    // Badge shows "2"
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders bell icon without badge when patient has completed all 4 readings', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: { id: 'p1', name: 'Demo Patient', role: ROLES.PATIENT },
      isAuthenticated: true,
    });
    // 4 readings logged today
    vi.spyOn(useReadingsHook, 'useReadings').mockReturnValue({
      data: {
        data: [
          { id: '1', readingDate: '2026-11-13T08:00:00Z', slot: 'MORNING_FASTING', value: 95 },
          { id: '2', readingDate: '2026-11-13T10:00:00Z', slot: 'AFTER_BREAKFAST', value: 130 },
          { id: '3', readingDate: '2026-11-13T13:00:00Z', slot: 'AFTER_LUNCH', value: 115 },
          { id: '4', readingDate: '2026-11-13T20:00:00Z', slot: 'AFTER_DINNER', value: 120 },
        ],
      },
    });

    renderDropdown();

    const bellBtn = screen.getByRole('button', { name: /view notifications/i });
    expect(bellBtn).toBeInTheDocument();
    // Badge should not exist
    expect(screen.queryByText(/^[1-4]$/)).not.toBeInTheDocument();
  });

  it('toggles open the notifications panel on click with pending slot information', async () => {
    const user = userEvent.setup();
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: { id: 'p1', name: 'Demo Patient', role: ROLES.PATIENT },
      isAuthenticated: true,
    });
    vi.spyOn(useReadingsHook, 'useReadings').mockReturnValue({
      data: {
        data: [
          { id: '1', readingDate: '2026-11-13T08:00:00Z', slot: 'MORNING_FASTING', value: 95 },
        ],
      },
    });

    renderDropdown();

    const bellBtn = screen.getByRole('button', { name: /view notifications/i });
    await user.click(bellBtn);

    // Panel is opened
    expect(screen.getByRole('dialog', { name: /notifications panel/i })).toBeInTheDocument();
    expect(screen.getByText(/3 pending/i)).toBeInTheDocument();
    expect(screen.getByText(/pending meal slot readings/i)).toBeInTheDocument();
    expect(screen.getByText(/log now on dashboard/i)).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: { id: 'p1', name: 'Demo Patient', role: ROLES.PATIENT },
      isAuthenticated: true,
    });
    vi.spyOn(useReadingsHook, 'useReadings').mockReturnValue({ data: { data: [] } });

    render(
      <MemoryRouter>
        <div>
          <span data-testid="outside">Outside area</span>
          <NotificationDropdown />
        </div>
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /view notifications/i });
    await user.click(bellBtn);
    expect(screen.getByRole('dialog', { name: /notifications panel/i })).toBeInTheDocument();

    // Click outside
    await user.click(screen.getByTestId('outside'));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /notifications panel/i })).not.toBeInTheDocument();
    });
  });

  it('closes dropdown when pressing Escape key', async () => {
    const user = userEvent.setup();
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: { id: 'p1', name: 'Demo Patient', role: ROLES.PATIENT },
      isAuthenticated: true,
    });
    vi.spyOn(useReadingsHook, 'useReadings').mockReturnValue({ data: { data: [] } });

    renderDropdown();

    const bellBtn = screen.getByRole('button', { name: /view notifications/i });
    await user.click(bellBtn);
    expect(screen.getByRole('dialog', { name: /notifications panel/i })).toBeInTheDocument();

    // Press Escape
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /notifications panel/i })).not.toBeInTheDocument();
    });
  });

  it('renders clean doctor view without patient meal slot reminders', async () => {
    const user = userEvent.setup();
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: { id: 'doc1', name: 'Dr. Sarah Smith', role: ROLES.DOCTOR },
      isAuthenticated: true,
    });
    vi.spyOn(useReadingsHook, 'useReadings').mockReturnValue({ data: { data: [] } });

    renderDropdown();

    const bellBtn = screen.getByRole('button', { name: /view notifications/i });
    await user.click(bellBtn);

    expect(screen.getByRole('dialog', { name: /notifications panel/i })).toBeInTheDocument();
    expect(screen.queryByText(/pending meal slot readings/i)).not.toBeInTheDocument();
    expect(screen.getByText(/automated reminders active/i)).toBeInTheDocument();
  });
});
