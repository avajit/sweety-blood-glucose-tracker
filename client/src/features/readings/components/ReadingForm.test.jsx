import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server.js';
import { ReadingForm } from './ReadingForm.jsx';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { MESSAGES } from '@sweety/shared/constants/messages.js';

describe('ReadingForm with MSW 2 (Module 10)', () => {
  it('is accessible: all inputs have associated labels', () => {
    renderWithProviders(<ReadingForm />);

    expect(screen.getByLabelText(/blood glucose/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/meal \/ clinical slot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reading date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/carbohydrates/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rapid insulin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save reading/i })).toBeInTheDocument();
  });

  it('submits optional carbohydrates and rapid insulin with the payload', async () => {
    let capturedBody = null;
    server.use(
      http.post('*/api/readings', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          {
            data: {
              id: 'reading-correlates-msw',
              ...capturedBody,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ReadingForm />);

    await user.type(screen.getByLabelText(/blood glucose/i), '140');
    await user.type(screen.getByLabelText(/carbohydrates/i), '55');
    await user.type(screen.getByLabelText(/rapid insulin/i), '4.5');

    await user.click(screen.getByRole('button', { name: /save reading/i }));

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
      expect(capturedBody.value).toBe(140);
      expect(capturedBody.carbsGrams).toBe(55);
      expect(capturedBody.insulinUnits).toBe(4.5);
    });
  });

  it('submitting an out-of-range value shows an inline error without calling API', async () => {
    let apiCalled = false;
    server.use(
      http.post('*/api/readings', () => {
        apiCalled = true;
        return HttpResponse.json({ data: {} }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ReadingForm />);

    const valueInput = screen.getByLabelText(/blood glucose/i);
    await user.type(valueInput, '35');

    await user.click(screen.getByRole('button', { name: /save reading/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/between 40 and 600/i)).toBeInTheDocument();
    });

    expect(apiCalled).toBe(false);
  });

  it('submitting a future date shows an inline validation error without calling API', async () => {
    let apiCalled = false;
    server.use(
      http.post('*/api/readings', () => {
        apiCalled = true;
        return HttpResponse.json({ data: {} }, { status: 201 });
      }),
    );

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

    expect(apiCalled).toBe(false);
  });

  it('submitting valid form calls POST /api/readings and triggers onSuccess', async () => {
    let capturedBody = null;
    server.use(
      http.post('*/api/readings', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          {
            data: {
              id: 'reading-msw-created-1',
              value: capturedBody.value,
              slot: capturedBody.slot,
              readingDate: capturedBody.date,
              notes: capturedBody.notes,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
          { status: 201 },
        );
      }),
    );

    const onSuccessMock = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ReadingForm onSuccess={onSuccessMock} />);

    const valueInput = screen.getByLabelText(/blood glucose/i);
    await user.type(valueInput, '115');

    await user.click(screen.getByRole('button', { name: /save reading/i }));

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
      expect(capturedBody.value).toBe(115);
      expect(capturedBody.slot).toBeDefined();
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('displays correct message from messages.js when MSW returns 409 DAILY_LIMIT', async () => {
    server.use(
      http.post('*/api/readings', () => {
        return HttpResponse.json(
          {
            error: {
              code: 'DAILY_LIMIT',
              message: MESSAGES.DAILY_LIMIT_EXCEEDED,
            },
          },
          { status: 409 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ReadingForm />);

    const valueInput = screen.getByLabelText(/blood glucose/i);
    await user.type(valueInput, '125');

    await user.click(screen.getByRole('button', { name: /save reading/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(MESSAGES.DAILY_LIMIT_EXCEEDED);
    });
  });

  it('displays duplicate slot message when MSW returns 409 CONFLICT', async () => {
    const duplicateMessage = MESSAGES.duplicateSlot('Fasting');
    server.use(
      http.post('*/api/readings', () => {
        return HttpResponse.json(
          {
            error: {
              code: 'CONFLICT',
              message: duplicateMessage,
            },
          },
          { status: 409 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ReadingForm />);

    const valueInput = screen.getByLabelText(/blood glucose/i);
    await user.type(valueInput, '130');

    await user.click(screen.getByRole('button', { name: /save reading/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(duplicateMessage);
    });
  });

  it('displays generic error banner when MSW returns 500 internal server error', async () => {
    server.use(
      http.post('*/api/readings', () => {
        return HttpResponse.json(
          {
            error: {
              code: 'INTERNAL_ERROR',
              message: MESSAGES.INTERNAL_ERROR,
            },
          },
          { status: 500 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ReadingForm />);

    const valueInput = screen.getByLabelText(/blood glucose/i);
    await user.type(valueInput, '140');

    await user.click(screen.getByRole('button', { name: /save reading/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(MESSAGES.INTERNAL_ERROR);
    });
  });
});
