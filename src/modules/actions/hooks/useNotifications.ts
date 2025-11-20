// ============================================================================
// Gate-H: Notifications Hooks
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getUserNotifications,
  getActionNotifications,
  createNotification,
  acknowledgeNotification,
  getNotificationSummary,
} from "../integration/actions-notifications";
import type {
  CreateNotificationInput,
  AcknowledgeNotificationInput,
} from "../types/notifications.types";

// ============================================================
// 1) Get User Notifications Query
// ============================================================
export function useUserNotifications(limit: number = 50) {
  return useQuery({
    queryKey: ["gate-h", "notifications", "user", limit],
    queryFn: () => getUserNotifications(limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// ============================================================
// 2) Get Action Notifications Query
// ============================================================
export function useActionNotifications(actionId: string | null) {
  return useQuery({
    queryKey: ["gate-h", "notifications", "action", actionId],
    queryFn: () => {
      if (!actionId) throw new Error("Action ID is required");
      return getActionNotifications(actionId);
    },
    enabled: !!actionId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// ============================================================
// 3) Get Notification Summary Query
// ============================================================
export function useNotificationSummary() {
  return useQuery({
    queryKey: ["gate-h", "notifications", "summary"],
    queryFn: () => getNotificationSummary(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================
// 4) Create Notification Mutation
// ============================================================
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNotificationInput) => createNotification(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "notifications"],
      });
      toast.success("تم إنشاء الإشعار بنجاح");
    },
    onError: (error) => {
      console.error("Create notification error:", error);
      toast.error("فشل إنشاء الإشعار");
    },
  });
}

// ============================================================
// 5) Acknowledge Notification Mutation
// ============================================================
export function useAcknowledgeNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AcknowledgeNotificationInput) =>
      acknowledgeNotification(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["gate-h", "notifications"],
      });
      toast.success("تم الإقرار بالإشعار");
    },
    onError: (error) => {
      console.error("Acknowledge notification error:", error);
      toast.error("فشل الإقرار بالإشعار");
    },
  });
}
