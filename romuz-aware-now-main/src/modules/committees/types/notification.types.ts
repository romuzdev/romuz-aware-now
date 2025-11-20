/**
 * Committees Module - Notification Types
 * D4 Enhancement
 */

export type CommitteeNotificationType =
  | 'meeting_scheduled'
  | 'meeting_reminder'
  | 'meeting_cancelled'
  | 'decision_made'
  | 'followup_assigned'
  | 'followup_due'
  | 'workflow_assigned'
  | 'workflow_completed'
  | 'member_added'
  | 'document_shared'
  | 'custom';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'webhook';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CommitteeNotification {
  id: string;
  tenant_id: string;
  committee_id?: string;
  notification_type: CommitteeNotificationType;
  recipient_id: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  error_message?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  committee?: {
    name: string;
    code: string;
  };
}

export interface NotificationFilters {
  status?: NotificationStatus;
  channel?: NotificationChannel;
  notification_type?: CommitteeNotificationType;
  limit?: number;
}

export interface CreateNotificationPayload {
  committee_id?: string;
  notification_type: CommitteeNotificationType;
  recipient_id: string;
  channel?: NotificationChannel;
  title: string;
  message: string;
  priority?: NotificationPriority;
  scheduled_at?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
}
