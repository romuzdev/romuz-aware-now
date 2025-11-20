// ============================================================================
// Gate-H: Notifications Types & Schemas
// ============================================================================

import { z } from "zod";

// ============================================================
// 1) Notification Types
// ============================================================
export const NotificationType = z.enum([
  "reminder",
  "escalation",
  "milestone_due",
  "overdue",
  "at_risk",
  "completed",
]);
export type NotificationType = z.infer<typeof NotificationType>;

export const NotificationSeverity = z.enum([
  "info",
  "warning",
  "critical",
]);
export type NotificationSeverity = z.infer<typeof NotificationSeverity>;

export const DeliveryStatus = z.enum([
  "pending",
  "sent",
  "failed",
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatus>;

// ============================================================
// 2) Notification Row (from DB)
// ============================================================
export const ActionNotification = z.object({
  id: z.string().uuid(),
  action_id: z.string().uuid(),
  notification_type: NotificationType,
  severity: NotificationSeverity,
  title_ar: z.string(),
  message_ar: z.string(),
  recipient_user_ids: z.array(z.string().uuid()),
  trigger_condition: z.any().nullable(),
  triggered_at: z.string(),
  delivery_channels: z.array(z.string()),
  sent_at: z.string().nullable(),
  delivery_status: DeliveryStatus,
  acknowledged_by: z.string().uuid().nullable(),
  acknowledged_at: z.string().nullable(),
  metadata: z.any().nullable(),
  created_at: z.string(),
});
export type ActionNotification = z.infer<typeof ActionNotification>;

// ============================================================
// 3) Create Notification Input
// ============================================================
export const CreateNotificationInput = z.object({
  actionId: z.string().uuid(),
  notificationType: NotificationType,
  severity: NotificationSeverity,
  titleAr: z.string().min(1, "العنوان مطلوب"),
  messageAr: z.string().min(1, "الرسالة مطلوبة"),
  recipientUserIds: z.array(z.string().uuid()).min(1, "يجب تحديد مستلم واحد على الأقل"),
  deliveryChannels: z.array(z.string()).default(["in_app"]),
  triggerCondition: z.any().optional(),
  metadata: z.any().optional(),
});
export type CreateNotificationInput = z.infer<typeof CreateNotificationInput>;

// ============================================================
// 4) Acknowledge Notification Input
// ============================================================
export const AcknowledgeNotificationInput = z.object({
  notificationId: z.string().uuid(),
});
export type AcknowledgeNotificationInput = z.infer<typeof AcknowledgeNotificationInput>;

// ============================================================
// 5) Notification Summary
// ============================================================
export const NotificationSummary = z.object({
  total: z.number().int(),
  pending: z.number().int(),
  sent: z.number().int(),
  failed: z.number().int(),
  acknowledged: z.number().int(),
  byType: z.record(NotificationType, z.number().int()),
  bySeverity: z.record(NotificationSeverity, z.number().int()),
});
export type NotificationSummary = z.infer<typeof NotificationSummary>;
