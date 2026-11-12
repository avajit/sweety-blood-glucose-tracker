import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteReading } from '../../../api/readings.api.js';
import { queryKeys } from '../../../api/queryKeys.js';

/**
 * Mutation hook for deleting an existing glucose reading.
 * Automatically invalidates readings and reports caches upon success.
 */
export function useDeleteReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.readings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
