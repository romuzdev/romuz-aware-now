// ============================================================================
// Gate-H Hooks: Action Updates Query
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { listUpdates } from "../integration";

/**
 * Query hook for fetching updates for a specific action
 * 
 * @example
 * const { data: updates } = useGateHActionUpdates(actionId);
 */
export function useGateHActionUpdates(actionId: string | null) {
  return useQuery({
    queryKey: ["gate-h", "actions", actionId ?? "missing", "updates"],
    queryFn: () => {
      if (!actionId) return Promise.resolve([]);
      return listUpdates(actionId);
    },
    enabled: !!actionId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
