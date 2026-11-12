import { useQuery } from '@tanstack/react-query';
import { getDoctorPatients } from '../../../api/doctors.api.js';
import { queryKeys } from '../../../api/queryKeys.js';

/**
 * Hook to retrieve linked patients for the authenticated doctor.
 */
export function usePatients() {
  return useQuery({
    queryKey: queryKeys.doctors.patients,
    queryFn: getDoctorPatients,
  });
}
