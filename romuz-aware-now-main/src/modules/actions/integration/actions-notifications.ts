// ============================================================================
// Gate-H: Notifications Integration Layer
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type {
  ActionNotification,
  CreateNotificationInput,
  AcknowledgeNotificationInput,
  NotificationSummary,
} from "../types/notifications.types";

// ============================================================
// 1) Get Notifications for User
// ============================================================
export async function getUserNotifications(
  limit: number = 50
): Promise<ActionNotification[]> {
  const { data, error } = await supabase
    .from("action_plan_notifications")
    .select("*")
    .order("triggered_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getUserNotifications error:", error);
    throw new Error(`فشل جلب الإشعارات: ${error.message}`);
  }

  return data || [];
}

// ============================================================
// 2) Get Notifications for Action
// ============================================================
export async function getActionNotifications(
  actionId: string
): Promise<ActionNotification[]> {
  const { data, error } = await supabase
    .from("action_plan_notifications")
    .select("*")
    .eq("action_id", actionId)
    .order("triggered_at", { ascending: false });

  if (error) {
    console.error("getActionNotifications error:", error);
    throw new Error(`فشل جلب إشعارات الإجراء: ${error.message}`);
  }

  return data || [];
}

// ============================================================
// 3) Create Notification
// ============================================================
export async function createNotification(
  input: CreateNotificationInput
): Promise<ActionNotification> {
  const { data, error } = await supabase
    .from("action_plan_notifications")
    .insert({
      action_id: input.actionId,
      notification_type: input.notificationType,
      severity: input.severity,
      title_ar: input.titleAr,
      message_ar: input.messageAr,
      recipient_user_ids: input.recipientUserIds,
      delivery_channels: input.deliveryChannels,
      trigger_condition: input.triggerCondition || null,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("createNotification error:", error);
    throw new Error(`فشل إنشاء الإشعار: ${error.message}`);
  }

  return data;
}

// ============================================================
// 4) Acknowledge Notification
// ============================================================
export async function acknowledgeNotification(
  input: AcknowledgeNotificationInput
): Promise<ActionNotification> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from("action_plan_notifications")
    .update({
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", input.notificationId)
    .select()
    .single();

  if (error) {
    console.error("acknowledgeNotification error:", error);
    throw new Error(`فشل الإقرار بالإشعار: ${error.message}`);
  }

  return data;
}

// ============================================================
// 5) Get Notification Summary
// ============================================================
export async function getNotificationSummary(): Promise<NotificationSummary> {
  const notifications = await getUserNotifications(1000);

  const summary: NotificationSummary = {
    total: notifications.length,
    pending: notifications.filter((n) => n.delivery_status === "pending").length,
    sent: notifications.filter((n) => n.delivery_status === "sent").length,
    failed: notifications.filter((n) => n.delivery_status === "failed").length,
    acknowledged: notifications.filter((n) => n.acknowledged_at !== null).length,
    byType: {
      reminder: 0,
      escalation: 0,
      milestone_due: 0,
      overdue: 0,
      at_risk: 0,
      completed: 0,
    },
    bySeverity: {
      info: 0,
      warning: 0,
      critical: 0,
    },
  };

  notifications.forEach((n) => {
    summary.byType[n.notification_type]++;
    summary.bySeverity[n.severity]++;
  });

  return summary;
}

// ============================================================
// 6) Mark Notification as Sent
// ============================================================
export async function markNotificationAsSent(
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from("action_plan_notifications")
    .update({
      delivery_status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (error) {
    console.error("markNotificationAsSent error:", error);
    throw new Error(`فشل تحديث حالة الإشعار: ${error.message}`);
  }
}
