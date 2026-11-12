import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateReading } from '../../../api/readings.api.js';
import { queryKeys } from '../../../api/queryKeys.js';

/**
 * Mutation hook for updating an existing glucose reading.
 * Automatically invalidates readings and reports caches upon success.
 */
export function useUpdateReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateReading(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.readings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
