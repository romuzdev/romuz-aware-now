// ============================================================================
// Part 13.2: Notification Integration Layer
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  NotificationTemplate,
  NotificationQueueItem,
  NotificationLogEntry,
  NotificationTemplateFormData,
  EnqueueNotificationPayload,
  NotificationQueueStats,
} from '@/modules/campaigns';

// ============================================================================
// Templates CRUD
// ============================================================================

export async function fetchNotificationTemplates(
  tenantId: string
): Promise<NotificationTemplate[]> {
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('key', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapTemplate);
}

export async function upsertNotificationTemplate(
  tenantId: string,
  templateId: string | null,
  formData: NotificationTemplateFormData
): Promise<NotificationTemplate> {
  const payload = {
    tenant_id: tenantId,
    key: formData.key,
    subject: formData.subject,
    body: formData.body,
    is_active: formData.isActive,
    ...(templateId && { id: templateId }),
  };

  const { data, error } = await supabase
    .from('notification_templates')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapTemplate(data);
}

export async function deleteNotificationTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('notification_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Queue Management
// ============================================================================

export async function fetchNotificationQueue(
  campaignId: string
): Promise<NotificationQueueItem[]> {
  const { data, error } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('scheduled_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapQueueItem);
}

export async function fetchNotificationQueueStats(
  campaignId: string
): Promise<NotificationQueueStats> {
  const { data, error } = await supabase
    .from('notification_queue')
    .select('status')
    .eq('campaign_id', campaignId);

  if (error) throw error;

  const stats = {
    pending: 0,
    sent: 0,
    failed: 0,
    total: data?.length || 0,
  };

  data?.forEach((item) => {
    if (item.status === 'pending') stats.pending++;
    if (item.status === 'sent') stats.sent++;
    if (item.status === 'failed') stats.failed++;
  });

  return stats;
}

export async function enqueueNotifications(
  tenantId: string,
  payload: EnqueueNotificationPayload
): Promise<number> {
  const items = payload.participantIds.map((participantId) => ({
    tenant_id: tenantId,
    campaign_id: payload.campaignId,
    participant_id: participantId,
    template_key: payload.templateKey,
    scheduled_at: payload.scheduledAt || new Date().toISOString(),
    status: 'pending',
  }));

  const { error } = await supabase.from('notification_queue').insert(items);

  if (error) throw error;
  return items.length;
}

export async function sendNowSimulated(
  queueItemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch queue item
    const { data: queueItem, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('id', queueItemId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Simulate sending (no actual email/sms)
    const simulatedSuccess = Math.random() > 0.1; // 90% success rate

    // 3. Update queue item
    const { error: updateError } = await supabase
      .from('notification_queue')
      .update({
        status: simulatedSuccess ? 'sent' : 'failed',
        last_error: simulatedSuccess ? null : 'Simulated failure for testing',
      })
      .eq('id', queueItemId);

    if (updateError) throw updateError;

    // 4. Write to log
    const { error: logError } = await supabase
      .from('notification_log')
      .insert({
        tenant_id: queueItem.tenant_id,
        campaign_id: queueItem.campaign_id,
        participant_id: queueItem.participant_id,
        template_key: queueItem.template_key,
        sent_at: new Date().toISOString(),
        transport: 'simulated',
        status: simulatedSuccess ? 'success' : 'failed',
        meta: {
          queue_item_id: queueItemId,
          simulated: true,
          timestamp: new Date().toISOString(),
        },
      });

    if (logError) throw logError;

    return { success: simulatedSuccess };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function retryFailedNotification(queueItemId: string): Promise<void> {
  const { error } = await supabase
    .from('notification_queue')
    .update({
      status: 'pending',
      last_error: null,
      scheduled_at: new Date().toISOString(),
    })
    .eq('id', queueItemId);

  if (error) throw error;
}

export async function bulkRetryFailed(campaignId: string): Promise<number> {
  const { data, error } = await supabase
    .from('notification_queue')
    .update({
      status: 'pending',
      last_error: null,
      scheduled_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('status', 'failed')
    .select();

  if (error) throw error;
  return data?.length || 0;
}

// ============================================================================
// Logs
// ============================================================================

export async function fetchNotificationLogs(
  campaignId: string,
  limit = 100
): Promise<NotificationLogEntry[]> {
  const { data, error } = await supabase
    .from('notification_log')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(mapLogEntry);
}

// ============================================================================
// Mappers
// ============================================================================

function mapTemplate(raw: any): NotificationTemplate {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    key: raw.key,
    subject: raw.subject,
    body: raw.body,
    isActive: raw.is_active,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapQueueItem(raw: any): NotificationQueueItem {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    campaignId: raw.campaign_id,
    participantId: raw.participant_id,
    templateKey: raw.template_key,
    scheduledAt: raw.scheduled_at,
    status: raw.status,
    lastError: raw.last_error,
    createdAt: raw.created_at,
  };
}

function mapLogEntry(raw: any): NotificationLogEntry {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    campaignId: raw.campaign_id,
    participantId: raw.participant_id,
    templateKey: raw.template_key,
    sentAt: raw.sent_at,
    transport: raw.transport,
    status: raw.status,
    meta: raw.meta,
    createdAt: raw.created_at,
  };
}
