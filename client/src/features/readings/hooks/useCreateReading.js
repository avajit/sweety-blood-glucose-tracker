import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReading } from '../../../api/readings.api.js';
import { queryKeys } from '../../../api/queryKeys.js';

/**
 * Mutation hook for logging a new glucose reading.
 * Automatically invalidates readings and reports caches upon success.
 */
export function useCreateReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.readings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
