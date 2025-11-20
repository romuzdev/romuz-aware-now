// ============================================================================
// Gate-H: Tracking Hooks
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getTrackingHistory,
  getActionHealthMetrics,
  createTrackingSnapshot,
  autoCreateSnapshot,
} from "../integration/actions-tracking";
import type { CreateTrackingSnapshotInput } from "../types/tracking.types";

// ============================================================
// 1) Get Tracking History Query
// ============================================================
export function useTrackingHistory(actionId: string | null, limit: number = 30) {
  return useQuery({
    queryKey: ["gate-h", "tracking", actionId, limit],
    queryFn: () => {
      if (!actionId) throw new Error("Action ID is required");
      return getTrackingHistory(actionId, limit);
    },
    enabled: !!actionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================
// 2) Get Action Health Metrics Query
// ============================================================
export function useActionHealthMetrics(actionId: string | null) {
  return useQuery({
    queryKey: ["gate-h", "health", actionId],
    queryFn: () => {
      if (!actionId) throw new Error("Action ID is required");
      return getActionHealthMetrics(actionId);
    },
    enabled: !!actionId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// ============================================================
// 3) Create Tracking Snapshot Mutation
// ============================================================
export function useCreateTrackingSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTrackingSnapshotInput) =>
      createTrackingSnapshot(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "tracking", variables.actionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "health", variables.actionId],
      });
      toast.success("تم إنشاء لقطة التتبع بنجاح");
    },
    onError: (error) => {
      console.error("Create tracking snapshot error:", error);
      toast.error("فشل إنشاء لقطة التتبع");
    },
  });
}

// ============================================================
// 4) Auto Create Snapshot Mutation
// ============================================================
export function useAutoCreateSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (actionId: string) => autoCreateSnapshot(actionId),
    onSuccess: (_, actionId) => {
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "tracking", actionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "health", actionId],
      });
    },
    onError: (error) => {
      console.error("Auto create snapshot error:", error);
    },
  });
}
