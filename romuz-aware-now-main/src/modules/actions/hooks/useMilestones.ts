// ============================================================================
// Gate-H: Milestones Hooks
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  completeMilestone,
} from "../integration/actions-milestones";
import type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "../types/milestones.types";

// ============================================================
// 1) Get Milestones Query
// ============================================================
export function useMilestones(actionId: string | null) {
  return useQuery({
    queryKey: ["gate-h", "milestones", actionId],
    queryFn: () => {
      if (!actionId) throw new Error("Action ID is required");
      return getMilestones(actionId);
    },
    enabled: !!actionId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// ============================================================
// 2) Create Milestone Mutation
// ============================================================
export function useCreateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMilestoneInput) => createMilestone(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "milestones", variables.actionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "actions", variables.actionId],
      });
      toast.success("تم إضافة المعلم بنجاح");
    },
    onError: (error) => {
      console.error("Create milestone error:", error);
      toast.error("فشل إضافة المعلم");
    },
  });
}

// ============================================================
// 3) Update Milestone Mutation
// ============================================================
export function useUpdateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMilestoneInput) => updateMilestone(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "milestones", data.action_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "actions", data.action_id],
      });
      toast.success("تم تحديث المعلم بنجاح");
    },
    onError: (error) => {
      console.error("Update milestone error:", error);
      toast.error("فشل تحديث المعلم");
    },
  });
}

// ============================================================
// 4) Delete Milestone Mutation
// ============================================================
export function useDeleteMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (milestoneId: string) => deleteMilestone(milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gate-h", "milestones"] });
      toast.success("تم حذف المعلم بنجاح");
    },
    onError: (error) => {
      console.error("Delete milestone error:", error);
      toast.error("فشل حذف المعلم");
    },
  });
}

// ============================================================
// 5) Complete Milestone Mutation
// ============================================================
export function useCompleteMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestoneId,
      evidenceUrls,
    }: {
      milestoneId: string;
      evidenceUrls?: string[];
    }) => completeMilestone(milestoneId, evidenceUrls),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "milestones", data.action_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "actions", data.action_id],
      });
      toast.success("تم إكمال المعلم بنجاح");
    },
    onError: (error) => {
      console.error("Complete milestone error:", error);
      toast.error("فشل إكمال المعلم");
    },
  });
}
