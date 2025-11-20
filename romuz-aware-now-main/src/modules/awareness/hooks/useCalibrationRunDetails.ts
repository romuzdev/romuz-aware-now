// Gate-J Part 4.4: useCalibrationRunDetails Hook
// Fetch a single calibration run by ID

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CalibrationRun } from '@/modules/awareness';

export function useCalibrationRunDetails(calibrationRunId: string) {
  return useQuery({
    queryKey: ['calibration-run', calibrationRunId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('awareness_impact_calibration_runs')
        .select('*')
        .eq('id', calibrationRunId)
        .single();

      if (error) throw error;
      
      return data as CalibrationRun;
    },
    enabled: !!calibrationRunId,
  });
}
