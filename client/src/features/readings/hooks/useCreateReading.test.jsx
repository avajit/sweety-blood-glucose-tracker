import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCreateReading } from './useCreateReading.js';
import * as readingsApi from '../../../api/readings.api.js';
import { createTestQueryClientWrapper } from '../../../test/renderWithProviders.jsx';

describe('useCreateReading', () => {
  it('calls invalidateQueries on readings and reports after successful mutation', async () => {
    vi.spyOn(readingsApi, 'createReading').mockResolvedValue({
      id: 'test-1',
      value: 120,
    });

    const { queryClient, wrapper } = createTestQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateReading(), { wrapper });

    await result.current.mutateAsync({
      value: 120,
      slot: 'MORNING_FASTING',
      date: '2026-11-12',
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['readings'] }),
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['reports'] }),
      );
    });
  });
});

