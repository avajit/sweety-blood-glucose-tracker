import { useQuery } from '@tanstack/react-query';
import { getReadings } from '../../../api/readings.api.js';
import { queryKeys } from '../../../api/queryKeys.js';

/**
 * Hook to fetch paginated readings with filters.
 * @param {object} [params]
 */
export function useReadings(params = {}) {
  return useQuery({
    queryKey: queryKeys.readings.list(params),
    queryFn: () => getReadings(params),
    staleTime: 60 * 1000,
  });
}
