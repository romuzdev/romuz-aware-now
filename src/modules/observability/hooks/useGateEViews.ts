// ============================================================================
// Gate-E Hooks: Saved Alert Views (D1 Standard)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  saveAlertView,
  listAlertViews,
  deleteAlertView,
} from "@/modules/observability/integration";
import { toast } from "@/hooks/use-toast";
import type { SaveAlertViewInput, GateEAlertView } from "../types";

/**
 * Query hook for listing saved alert views
 */
export function useGateEAlertViews() {
  return useQuery({
    queryKey: ["gate-e", "alert-views"],
    queryFn: listAlertViews,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Mutation hook for saving/updating an alert view
 */
export function useSaveGateEAlertView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveAlertView,
    onSuccess: (data: GateEAlertView) => {
      toast({
        title: "تم الحفظ",
        description: data.is_default ? "تم حفظ العرض كافتراضي" : "تم حفظ عرض التنبيهات بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["gate-e", "alert-views"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الحفظ",
        description: error.message || "فشل حفظ العرض",
        variant: "destructive",
      });
    },
  });
}

/**
 * Mutation hook for deleting an alert view
 */
export function useDeleteGateEAlertView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAlertView,
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف العرض بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["gate-e", "alert-views"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الحذف",
        description: error.message || "فشل حذف العرض",
        variant: "destructive",
      });
    },
  });
}
