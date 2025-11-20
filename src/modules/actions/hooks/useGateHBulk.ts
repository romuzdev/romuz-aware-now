// ============================================================================
// Gate-H Hooks: Bulk Operations (D1 Standard)
// ============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bulkUpdateActionStatus,
  bulkAssignActions,
  bulkDeleteActions,
} from "../integration";
import { toast } from "@/hooks/use-toast";
import type {
  BulkUpdateStatusInput,
  BulkAssignInput,
  BulkDeleteInput,
  BulkOperationResult,
} from "../types";

/**
 * Mutation hook for bulk status update
 */
export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkUpdateActionStatus,
    onSuccess: (result: BulkOperationResult) => {
      if (result.status === "completed") {
        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث ${result.affected_count} إجراء بنجاح`,
        });
      } else if (result.status === "partial") {
        toast({
          title: "تحذير",
          description: `تم تحديث ${result.affected_count} إجراء، وفشل البعض الآخر`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "فشل التحديث",
          description: "فشل التحديث الجماعي للإجراءات",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["gate-h", "actions"] });
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
 * Mutation hook for bulk assignment
 */
export function useBulkAssign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkAssignActions,
    onSuccess: (result: BulkOperationResult) => {
      if (result.status === "completed") {
        toast({
          title: "تم التعيين بنجاح",
          description: `تم تعيين ${result.affected_count} إجراء بنجاح`,
        });
      } else if (result.status === "partial") {
        toast({
          title: "تحذير",
          description: `تم تعيين ${result.affected_count} إجراء، وفشل البعض الآخر`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "فشل التعيين",
          description: "فشل التعيين الجماعي للإجراءات",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["gate-h", "actions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل التعيين",
        description: error.message || "فشل التعيين الجماعي",
        variant: "destructive",
      });
    },
  });
}

/**
 * Mutation hook for bulk delete
 */
export function useBulkDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteActions,
    onSuccess: (result: BulkOperationResult) => {
      if (result.status === "completed") {
        toast({
          title: "تم الحذف بنجاح",
          description: `تم حذف ${result.affected_count} إجراء بنجاح`,
        });
      } else if (result.status === "partial") {
        toast({
          title: "تحذير",
          description: `تم حذف ${result.affected_count} إجراء، وفشل البعض الآخر`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "فشل الحذف",
          description: "فشل الحذف الجماعي للإجراءات",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["gate-h", "actions"] });
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
