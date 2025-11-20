// ============================================================================
// Campaigns Module - Notification System Types
// ============================================================================

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  key: string; // 'campaign_start', 'due_soon', 'completion', etc.
  subject: string;
  body: string; // Can include {{campaign_name}}, {{employee_ref}}, etc.
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationQueueItem {
  id: string;
  tenantId: string;
  campaignId: string;
  participantId: string;
  templateKey: string;
  scheduledAt: string;
  status: 'pending' | 'sent' | 'failed';
  lastError: string | null;
  createdAt: string;
}

export interface NotificationLogEntry {
  id: string;
  tenantId: string;
  campaignId: string;
  participantId: string;
  templateKey: string;
  sentAt: string;
  transport: string; // 'email', 'sms', 'webhook', 'simulated'
  status: string; // 'success', 'failed', 'bounced', etc.
  meta: Record<string, any> | null;
  createdAt: string;
}

// Form data types
export interface NotificationTemplateFormData {
  key: string;
  subject: string;
  body: string;
  isActive: boolean;
}

export interface EnqueueNotificationPayload {
  campaignId: string;
  participantIds: string[];
  templateKey: string;
  scheduledAt?: string;
}

export interface SendNowPayload {
  queueItemId: string;
}

// Stats for queue
export interface NotificationQueueStats {
  pending: number;
  sent: number;
  failed: number;
  total: number;
}
