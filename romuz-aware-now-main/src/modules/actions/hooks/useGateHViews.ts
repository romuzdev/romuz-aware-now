// ============================================================================
// Gate-H Hooks: Saved Views (D1 Standard)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  saveActionView,
  listActionViews,
  deleteActionView,
} from "../integration";
import { showSuccess, showError } from "@/lib/notifications/toastMessages";
import { handleError } from "@/lib/errors/errorHandler";
import type { SaveViewInput, GateHActionView } from "../types";

/**
 * Query hook for listing saved views
 */
export function useGateHViews() {
  return useQuery({
    queryKey: ["gate-h", "views"],
    queryFn: listActionViews,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Mutation hook for saving/updating a view
 */
export function useSaveGateHView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveActionView,
    onSuccess: (data: GateHActionView) => {
      showSuccess("saved", data.is_default ? "العرض الافتراضي" : "العرض");
      queryClient.invalidateQueries({ queryKey: ["gate-h", "views"] });
    },
    onError: (error: Error) => {
      showError("updateFailed", "العرض");
    },
  });
}

/**
 * Mutation hook for deleting a view
 */
export function useDeleteGateHView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActionView,
    onSuccess: () => {
      showSuccess("deleted", "العرض");
      queryClient.invalidateQueries({ queryKey: ["gate-h", "views"] });
    },
    onError: (error: Error) => {
      showError("deleteFailed", "العرض");
    },
  });
}
