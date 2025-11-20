// Gate-J Part 4.4: useCalibrationRuns Hook
// Fetch calibration runs for a tenant

import { useQuery } from '@tanstack/react-query';
import { fetchCalibrationRuns } from '@/modules/awareness/integration';
import type { OverallStatus } from '@/modules/awareness';

interface UseCalibrationRunsFilters {
  modelVersion?: number;
  overallStatus?: OverallStatus;
  periodStart?: string;
  periodEnd?: string;
}

export function useCalibrationRuns(
  tenantId: string,
  filters?: UseCalibrationRunsFilters
) {
  return useQuery({
    queryKey: ['calibration-runs', tenantId, filters],
    queryFn: () => fetchCalibrationRuns(tenantId, filters),
    enabled: !!tenantId,
  });
}
