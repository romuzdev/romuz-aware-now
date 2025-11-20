// ============================================================================
// Gate-H Hooks: Actions List Query
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { listActions } from "../integration";
import type { ListActionsFilters } from "../types";

/**
 * Query hook for fetching Gate-H action items with filters
 * 
 * @example
 * // All actions
 * const { data: actions } = useGateHActions();
 * 
 * @example
 * // Filter by status
 * const { data: activeActions } = useGateHActions({
 *   statuses: ['new', 'in_progress']
 * });
 * 
 * @example
 * // Overdue actions only
 * const { data: overdueActions } = useGateHActions({
 *   overdueOnly: true
 * });
 */
export function useGateHActions(filters: ListActionsFilters = {}) {
  const filtersKey = JSON.stringify(filters);

  return useQuery({
    queryKey: ["gate-h", "actions", filtersKey],
    queryFn: () => listActions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
