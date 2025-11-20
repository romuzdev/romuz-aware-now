/**
 * D4 Enhancement: Committee Notifications Integration Layer
 * CRUD operations for committee notifications
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Get current tenant ID
 */
async function getCurrentTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  return data?.tenant_id || null;
}

/**
 * Get current user ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Fetch notifications for current user
 */
export async function fetchMyNotifications(filters?: {
  status?: string;
  channel?: string;
  limit?: number;
}) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  let query = supabase
    .from('committee_notifications')
    .select(`
      *,
      committee:committees(name, code)
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.channel) {
    query = query.eq('channel', filters.channel);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch unread notifications count
 */
export async function fetchUnreadNotificationsCount() {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const { count, error } = await supabase
    .from('committee_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .neq('status', 'read');

  if (error) throw error;
  return count || 0;
}

/**
 * Fetch notifications for a committee
 */
export async function fetchCommitteeNotifications(committeeId: string) {
  const { data, error } = await supabase
    .from('committee_notifications')
    .select('*')
    .eq('committee_id', committeeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Create notification
 */
export async function createNotification(notification: any) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('No tenant context');

  const { data, error } = await supabase
    .from('committee_notifications')
    .insert({
      ...notification,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create bulk notifications
 */
export async function createBulkNotifications(notifications: any[]) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('No tenant context');

  const notificationsWithTenant = notifications.map(n => ({
    ...n,
    tenant_id: tenantId,
  }));

  const { data, error } = await supabase
    .from('committee_notifications')
    .insert(notificationsWithTenant)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string) {
  const { data, error } = await supabase
    .from('committee_notifications')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('committee_notifications')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
    })
    .eq('recipient_id', userId)
    .neq('status', 'read');

  if (error) throw error;
}

/**
 * Delete notification
 */
export async function deleteNotification(id: string) {
  const { error } = await supabase
    .from('committee_notifications')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Delete all read notifications
 */
export async function deleteReadNotifications() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('committee_notifications')
    .delete()
    .eq('recipient_id', userId)
    .eq('status', 'read');

  if (error) throw error;
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Send meeting scheduled notification
 */
export async function notifyMeetingScheduled(
  committeeId: string,
  meetingId: string,
  recipientIds: string[],
  meetingTitle: string,
  scheduledAt: string
) {
  const notifications = recipientIds.map(recipientId => ({
    committee_id: committeeId,
    notification_type: 'meeting_scheduled',
    recipient_id: recipientId,
    channel: 'in_app',
    title: 'اجتماع جديد',
    message: `تم جدولة اجتماع: ${meetingTitle} في ${new Date(scheduledAt).toLocaleString('ar-SA')}`,
    entity_type: 'meeting',
    entity_id: meetingId,
  }));

  return createBulkNotifications(notifications);
}

/**
 * Send meeting reminder notification
 */
export async function notifyMeetingReminder(
  committeeId: string,
  meetingId: string,
  recipientIds: string[],
  meetingTitle: string,
  scheduledAt: string
) {
  const notifications = recipientIds.map(recipientId => ({
    committee_id: committeeId,
    notification_type: 'meeting_reminder',
    recipient_id: recipientId,
    channel: 'in_app',
    title: 'تذكير باجتماع',
    message: `تذكير: اجتماع ${meetingTitle} سيبدأ في ${new Date(scheduledAt).toLocaleString('ar-SA')}`,
    priority: 'high',
    entity_type: 'meeting',
    entity_id: meetingId,
  }));

  return createBulkNotifications(notifications);
}

/**
 * Send decision made notification
 */
export async function notifyDecisionMade(
  committeeId: string,
  decisionId: string,
  recipientIds: string[],
  decisionTitle: string
) {
  const notifications = recipientIds.map(recipientId => ({
    committee_id: committeeId,
    notification_type: 'decision_made',
    recipient_id: recipientId,
    channel: 'in_app',
    title: 'قرار جديد',
    message: `تم اتخاذ قرار: ${decisionTitle}`,
    entity_type: 'decision',
    entity_id: decisionId,
  }));

  return createBulkNotifications(notifications);
}

/**
 * Send followup assigned notification
 */
export async function notifyFollowupAssigned(
  committeeId: string,
  followupId: string,
  recipientId: string,
  followupTitle: string,
  dueAt: string
) {
  return createNotification({
    committee_id: committeeId,
    notification_type: 'followup_assigned',
    recipient_id: recipientId,
    channel: 'in_app',
    title: 'مهمة متابعة جديدة',
    message: `تم تعيين مهمة متابعة لك: ${followupTitle} - موعد الاستحقاق: ${new Date(dueAt).toLocaleDateString('ar-SA')}`,
    priority: 'high',
    entity_type: 'followup',
    entity_id: followupId,
  });
}

/**
 * Send followup due notification
 */
export async function notifyFollowupDue(
  committeeId: string,
  followupId: string,
  recipientId: string,
  followupTitle: string
) {
  return createNotification({
    committee_id: committeeId,
    notification_type: 'followup_due',
    recipient_id: recipientId,
    channel: 'in_app',
    title: 'مهمة متابعة مستحقة',
    message: `تنبيه: مهمة المتابعة "${followupTitle}" مستحقة الآن`,
    priority: 'urgent',
    entity_type: 'followup',
    entity_id: followupId,
  });
}

/**
 * Send workflow assigned notification
 */
export async function notifyWorkflowAssigned(
  committeeId: string,
  workflowId: string,
  recipientId: string,
  workflowTitle: string
) {
  return createNotification({
    committee_id: committeeId,
    notification_type: 'workflow_assigned',
    recipient_id: recipientId,
    channel: 'in_app',
    title: 'سير عمل جديد',
    message: `تم تعيين سير عمل لك: ${workflowTitle}`,
    entity_type: 'workflow',
    entity_id: workflowId,
  });
}

/**
 * Send member added notification
 */
export async function notifyMemberAdded(
  committeeId: string,
  recipientId: string,
  committeeName: string,
  role: string
) {
  return createNotification({
    committee_id: committeeId,
    notification_type: 'member_added',
    recipient_id: recipientId,
    channel: 'in_app',
    title: 'انضمام للجنة',
    message: `تم إضافتك إلى لجنة "${committeeName}" بصفة ${role}`,
    entity_type: 'committee',
    entity_id: committeeId,
  });
}
