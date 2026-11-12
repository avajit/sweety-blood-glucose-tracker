import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadingForm } from './ReadingForm.jsx';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import * as createReadingHook from '../hooks/useCreateReading.js';

describe('ReadingForm', () => {
  it('renders value input, slot dropdown, date picker, and save button', () => {
    vi.spyOn(createReadingHook, 'useCreateReading').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    renderWithProviders(<ReadingForm />);

    expect(screen.getByLabelText(/blood glucose/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/meal \/ clinical slot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reading date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save reading/i })).toBeInTheDocument();
  });

  it('displays validation error when submitting value outside 40–600 mg/dL', async () => {
    vi.spyOn(createReadingHook, 'useCreateReading').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const user = userEvent.setup();
    renderWithProviders(<ReadingForm />);

    const valueInput = screen.getByLabelText(/blood glucose/i);
    await user.type(valueInput, '35');

    await user.click(screen.getByRole('button', { name: /save reading/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/between 40 and 600/i)).toBeInTheDocument();
    });
  });

  it('displays validation error when entering a future date', async () => {
    vi.spyOn(createReadingHook, 'useCreateReading').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const user = userEvent.setup();
    renderWithProviders(<ReadingForm />);

    const valueInput = screen.getByLabelText(/blood glucose/i);
    await user.type(valueInput, '120');

    const dateInput = screen.getByLabelText(/reading date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2099-12-31');

    await user.click(screen.getByRole('button', { name: /save reading/i }));

    await waitFor(() => {
      expect(screen.getByText(/cannot be in the future/i)).toBeInTheDocument();
    });
  });

  it('calls mutation with parsed numeric value and slot on valid submit', async () => {
    const mutateAsyncMock = vi.fn().mockResolvedValue({ id: 'r-101' });
    vi.spyOn(createReadingHook, 'useCreateReading').mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isPending: false,
    });

    const onSuccessMock = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ReadingForm onSuccess={onSuccessMock} />);

    const valueInput = screen.getByLabelText(/blood glucose/i);
    await user.type(valueInput, '115');

    await user.click(screen.getByRole('button', { name: /save reading/i }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 115,
          slot: expect.any(String),
          date: expect.any(String),
        }),
      );
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });
});
