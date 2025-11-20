import { supabase } from '@/integrations/supabase/client';
import { useTenantUser } from '@/lib/app/get-tenant-user';

export type AuditAction = 
  | 'campaign.created' 
  | 'campaign.updated' 
  | 'campaign.deleted'
  | 'campaign.archived'
  | 'campaign.unarchived'
  | 'campaign.status_changed'
  | 'campaign.duplicated'
  // Gate-E: Observability & Alerts
  | 'alert_channel.created'
  | 'alert_channel.updated'
  | 'alert_channel.deleted'
  | 'alert_policy.created'
  | 'alert_policy.updated'
  | 'alert_policy.deleted'
  | 'alert_policy.enabled'
  | 'alert_policy.disabled'
  | 'alert_template.created'
  | 'alert_template.updated'
  | 'alert_template.deleted'
  | 'alert_event.viewed'
  | 'kpi_refresh.triggered'
  // Gate-I • Part 4C — QA Hooks & Audit Logging for Awareness Insights
  | 'awareness_insights.viewed'
  | 'awareness_insights.exported';

export function useAuditLog() {
  const { tenantId, userId } = useTenantUser();

  async function logCampaign(action: AuditAction, entityId: string, payload?: any) {
    // Hard preconditions: match RLS (tenant_id & actor required)
    if (!tenantId || !userId) {
      // do not block UX; silently skip if no context
      return;
    }
    try {
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        entity_type: 'campaign',
        entity_id: entityId,
        action,
        actor: userId,
        payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
      });
    } catch (err) {
      // swallow to avoid breaking UI; optionally console.warn in dev
      if (process.env.NODE_ENV === 'development') {
        console.warn('Audit log failed:', err);
      }
    }
  }

  async function logObservability(action: AuditAction, entityId: string, payload?: any) {
    if (!tenantId || !userId) {
      return;
    }
    try {
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        entity_type: 'observability',
        entity_id: entityId,
        action,
        actor: userId,
        payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Audit log failed:', err);
      }
    }
  }

  // Gate-I • Part 4C — Awareness Insights Audit Logging
  async function logAwarenessInsights(action: AuditAction, entityId: string, payload?: any) {
    if (!tenantId || !userId) {
      return;
    }
    try {
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        entity_type: 'awareness_analytics',
        entity_id: entityId,
        action,
        actor: userId,
        payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Audit log failed:', err);
      }
    }
  }

  return { logCampaign, logObservability, logAwarenessInsights };
}
