// ============================================================================
// Gate-H: Dependencies Hooks
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getDependencies,
  createDependency,
  updateDependency,
  deleteDependency,
  checkCircularDependencies,
} from "../integration/actions-dependencies";
import type {
  CreateDependencyInput,
  UpdateDependencyInput,
} from "../types/dependencies.types";

// ============================================================
// 1) Get Dependencies Query
// ============================================================
export function useDependencies(actionId: string | null) {
  return useQuery({
    queryKey: ["gate-h", "dependencies", actionId],
    queryFn: () => {
      if (!actionId) throw new Error("Action ID is required");
      return getDependencies(actionId);
    },
    enabled: !!actionId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// ============================================================
// 2) Create Dependency Mutation
// ============================================================
export function useCreateDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDependencyInput) => {
      // Check for circular dependencies first
      const hasCircular = await checkCircularDependencies(
        input.sourceActionId,
        input.targetActionId
      );

      if (hasCircular) {
        throw new Error("لا يمكن إنشاء التبعية: سيؤدي ذلك إلى تبعية دائرية");
      }

      return createDependency(input);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "dependencies", data.source_action_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "dependencies", data.target_action_id],
      });
      toast.success("تم إضافة التبعية بنجاح");
    },
    onError: (error: any) => {
      console.error("Create dependency error:", error);
      toast.error(error.message || "فشل إضافة التبعية");
    },
  });
}

// ============================================================
// 3) Update Dependency Mutation
// ============================================================
export function useUpdateDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDependencyInput) => updateDependency(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "dependencies", data.source_action_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "dependencies", data.target_action_id],
      });
      toast.success("تم تحديث التبعية بنجاح");
    },
    onError: (error) => {
      console.error("Update dependency error:", error);
      toast.error("فشل تحديث التبعية");
    },
  });
}

// ============================================================
// 4) Delete Dependency Mutation
// ============================================================
export function useDeleteDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dependencyId: string) => deleteDependency(dependencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gate-h", "dependencies"] });
      toast.success("تم حذف التبعية بنجاح");
    },
    onError: (error) => {
      console.error("Delete dependency error:", error);
      toast.error("فشل حذف التبعية");
    },
  });
}
