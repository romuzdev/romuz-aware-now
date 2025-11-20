// Gate-J Part 4.4: useWeightSuggestions Hook
// Fetch weight suggestions for calibration runs

import { useQuery } from '@tanstack/react-query';
import { fetchWeightSuggestions } from '@/modules/awareness/integration';
import type { SuggestionStatus } from '@/modules/awareness';

interface UseWeightSuggestionsFilters {
  calibrationRunId?: string;
  status?: SuggestionStatus;
}

export function useWeightSuggestions(
  tenantId: string,
  filters?: UseWeightSuggestionsFilters
) {
  return useQuery({
    queryKey: ['weight-suggestions', tenantId, filters],
    queryFn: () => fetchWeightSuggestions(tenantId, filters),
    enabled: !!tenantId,
  });
}
