import { useQuery } from '@tanstack/react-query';
import { getReport } from '../../../api/reports.api.js';
import { queryKeys } from '../../../api/queryKeys.js';

/**
 * Hook to fetch clinical report analytics.
 * @param {'daily' | 'month-to-date' | 'monthly'} type
 * @param {object} [params]
 * @param {string} [params.date] - Reference date string (YYYY-MM-DD)
 * @param {string} [params.patientId] - Required for doctor view
 */
export function useReport(type = 'daily', params = {}) {
  const { date, patientId } = params;

  return useQuery({
    queryKey: queryKeys.reports.byType(type, date, patientId),
    queryFn: () => getReport(type, { date, patientId }),
    enabled: Boolean(type),
    staleTime: 60 * 1000,
  });
}
