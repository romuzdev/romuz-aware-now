// Gate-J Part 4.4: useCalibrationCells Hook
// Fetch calibration cells for a specific run

import { useQuery } from '@tanstack/react-query';
import { fetchCalibrationCells } from '@/modules/awareness/integration';

export function useCalibrationCells(tenantId: string, calibrationRunId: string) {
  return useQuery({
    queryKey: ['calibration-cells', tenantId, calibrationRunId],
    queryFn: () => fetchCalibrationCells(tenantId, calibrationRunId),
    enabled: !!tenantId && !!calibrationRunId,
  });
}
