// ============================================================================
// Gate-H Hooks: Single Action Query
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { getActionById } from "../integration";

/**
 * Query hook for fetching a single action by ID
 * 
 * @example
 * const { data: action, isLoading } = useGateHActionById(actionId);
 */
export function useGateHActionById(actionId: string | null) {
  return useQuery({
    queryKey: ["gate-h", "actions", actionId ?? "missing"],
    queryFn: () => {
      if (!actionId) throw new Error("Action ID is required");
      return getActionById(actionId);
    },
    enabled: !!actionId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
