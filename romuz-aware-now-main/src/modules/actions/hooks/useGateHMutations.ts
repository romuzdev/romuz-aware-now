// ============================================================================
// Gate-H Hooks: Mutations (Create, Update, Close)
// ============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createActionFromRecommendation,
  addActionUpdate,
  updateActionStatus,
  verifyAndCloseAction,
  seedDemoActions,
} from "../integration";
import type {
  CreateActionFromRecommendationInput,
  AddActionUpdateInput,
  UpdateActionStatusInput,
  VerifyAndCloseActionInput,
} from "../types";
import { toast } from "sonner";

// ============================================================
// 1) Create Action from Recommendation
// ============================================================
/**
 * Mutation hook for creating a new action from Gate-K/J recommendation
 * Invalidates actions list on success
 * 
 * @example
 * const createAction = useCreateActionFromRecommendation();
 * createAction.mutate({
 *   source: 'K',
 *   titleAr: 'تحسين معدل إكمال التدريب',
 *   priority: 'high',
 *   dueDate: '2025-12-31'
 * });
 */
export function useCreateActionFromRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateActionFromRecommendationInput) =>
      createActionFromRecommendation(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gate-h", "actions"] });
      toast.success("تم إنشاء الإجراء بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "فشل إنشاء الإجراء");
    },
  });
}

// ============================================================
// 2) Add Action Update
// ============================================================
/**
 * Mutation hook for adding a new update (comment/progress/evidence/status)
 * Invalidates both action list and specific action updates on success
 * 
 * @example
 * const addUpdate = useAddActionUpdate();
 * addUpdate.mutate({
 *   actionId: 'uuid',
 *   updateType: 'progress',
 *   progressPct: 50,
 *   bodyAr: 'تم إكمال النصف الأول'
 * });
 */
export function useAddActionUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddActionUpdateInput) => addActionUpdate(input),
    onSuccess: (_, variables) => {
      // Invalidate updates for this specific action
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "actions", variables.actionId, "updates"],
      });
      // Also refresh actions list (status/progress may have changed)
      queryClient.invalidateQueries({ queryKey: ["gate-h", "actions"] });
      toast.success("تم إضافة التحديث بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "فشل إضافة التحديث");
    },
  });
}

// ============================================================
// 3) Update Action Status
// ============================================================
/**
 * Mutation hook for updating action status
 * Invalidates both actions list and updates on success
 * 
 * @example
 * const updateStatus = useUpdateActionStatus();
 * updateStatus.mutate({
 *   actionId: 'uuid',
 *   newStatus: 'in_progress',
 *   noteAr: 'بدء التنفيذ'
 * });
 */
export function useUpdateActionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateActionStatusInput) => updateActionStatus(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gate-h", "actions"] });
      if (data.id) {
        queryClient.invalidateQueries({
          queryKey: ["gate-h", "actions", data.id, "updates"],
        });
      }
      toast.success("تم تحديث حالة الإجراء بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "فشل تحديث الحالة");
    },
  });
}

// ============================================================
// 4) Verify & Close Action
// ============================================================
/**
 * Mutation hook for verifying and closing action
 * Includes verification logic (evidence required, progress 100%)
 * 
 * @example
 * const verifyClose = useVerifyAndCloseAction();
 * verifyClose.mutate({
 *   actionId: 'uuid',
 *   evidenceUrl: 'https://...',
 *   closureNote: 'تم التنفيذ بنجاح'
 * });
 */
export function useVerifyAndCloseAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VerifyAndCloseActionInput) =>
      verifyAndCloseAction(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gate-h", "actions"] });
      if (data.id) {
        queryClient.invalidateQueries({
          queryKey: ["gate-h", "actions", data.id, "updates"],
        });
      }
      toast.success("تم إغلاق الإجراء بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "فشل إغلاق الإجراء");
    },
  });
}

// ============================================================
// 5) Seed Demo Actions
// ============================================================
/**
 * Mutation hook for seeding demo actions (for testing)
 * 
 * @example
 * const seedDemo = useSeedDemoActions();
 * seedDemo.mutate();
 */
export function useSeedDemoActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: seedDemoActions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gate-h", "actions"] });
      toast.success(data.message || "تم إنشاء البيانات التجريبية بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "فشل إنشاء البيانات التجريبية");
    },
  });
}
