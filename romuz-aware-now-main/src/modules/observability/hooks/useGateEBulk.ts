// ============================================================================
// Gate-E Hooks: Bulk Alert Operations (D1 Standard)
// ============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bulkToggleAlertRules,
  bulkUpdateAlertSeverity,
  bulkDeleteAlertRules,
} from "@/modules/observability/integration";
import { toast } from "@/hooks/use-toast";
import type {
  BulkToggleRulesInput,
  BulkUpdateSeverityInput,
  BulkDeleteRulesInput,
  BulkAlertOperationResult,
} from "../types";

/**
 * Mutation hook for bulk toggle (activate/deactivate) alert rules
 */
export function useBulkToggleAlertRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkToggleAlertRules,
    onSuccess: (result: BulkAlertOperationResult) => {
      if (result.status === "completed") {
        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث ${result.affected_count} قاعدة بنجاح`,
        });
      } else if (result.status === "partial") {
        toast({
          title: "تحذير",
          description: `تم تحديث ${result.affected_count} قاعدة، وفشل البعض الآخر`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "فشل التحديث",
          description: "فشل التحديث الجماعي للقواعد",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["gate-e", "alert-rules"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل التحديث",
        description: error.message || "فشل التحديث الجماعي",
        variant: "destructive",
      });
    },
  });
}

/**
 * Mutation hook for bulk update alert severity
 */
export function useBulkUpdateAlertSeverity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkUpdateAlertSeverity,
    onSuccess: (result: BulkAlertOperationResult) => {
      if (result.status === "completed") {
        toast({
          title: "تم تحديث الشدة",
          description: `تم تحديث شدة ${result.affected_count} قاعدة بنجاح`,
        });
      } else if (result.status === "partial") {
        toast({
          title: "تحذير",
          description: `تم تحديث ${result.affected_count} قاعدة، وفشل البعض الآخر`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "فشل التحديث",
          description: "فشل التحديث الجماعي للشدة",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["gate-e", "alert-rules"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل التحديث",
        description: error.message || "فشل تحديث الشدة",
        variant: "destructive",
      });
    },
  });
}

/**
 * Mutation hook for bulk delete alert rules
 */
export function useBulkDeleteAlertRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteAlertRules,
    onSuccess: (result: BulkAlertOperationResult) => {
      if (result.status === "completed") {
        toast({
          title: "تم الحذف بنجاح",
          description: `تم حذف ${result.affected_count} قاعدة بنجاح`,
        });
      } else if (result.status === "partial") {
        toast({
          title: "تحذير",
          description: `تم حذف ${result.affected_count} قاعدة، وفشل البعض الآخر`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "فشل الحذف",
          description: "فشل الحذف الجماعي للقواعد",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["gate-e", "alert-rules"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الحذف",
        description: error.message || "فشل الحذف الجماعي",
        variant: "destructive",
      });
    },
  });
}
