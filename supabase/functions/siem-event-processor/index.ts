/**
 * SIEM Event Processor Edge Function
 * M18.5 - SecOps Integration
 * 
 * Purpose:
 * 1. Receive security events from external systems (batch processing)
 * 2. Normalize event data into standard format
 * 3. Enrich events with additional context
 * 4. Check for threat intelligence matches
 * 5. Correlate related events
 * 6. Create incidents for critical events
 * 7. Trigger SOAR playbooks
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getTenantId } from '../_shared/tenant-utils.ts';

interface SecurityEventInput {
  timestamp: string;
  event_type: string;
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source_system?: string;
  source_ip?: string;
  destination_ip?: string;
  user_id?: string;
  raw_log?: string;
  event_data: Record<string, any>;
}

interface NormalizedEvent {
  event_timestamp: string;
  event_type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source_system?: string;
  source_ip?: string;
  destination_ip?: string;
  user_id?: string;
  event_data: Record<string, any>;
  raw_log?: string;
  normalized_fields: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SIEM Processor] Processing event batch...');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Get tenant ID
    const tenantId = await getTenantId(supabaseClient, user.id);
    console.log(`[SIEM Processor] Processing for tenant: ${tenantId}`);

    // Parse request body
    const { events } = await req.json();

    if (!events || !Array.isArray(events)) {
      throw new Error('Invalid request: events array required');
    }

    const results = [];

    for (const event of events) {
      try {
        // 1. Normalize event data
        const normalized = normalizeSecurityEvent(event);
        console.log(`[SIEM Processor] Normalized event: ${normalized.event_type}`);

        // 2. Check for threat intelligence matches
        const threatMatch = await checkThreatIndicators(
          supabaseClient,
          tenantId,
          normalized
        );

        if (threatMatch) {
          console.log(`[SIEM Processor] Threat match found: ${threatMatch.id}`);
          normalized.severity = 'critical'; // Escalate severity
        }

        // 3. Correlate with other events
        const correlationId = await correlateEvents(
          supabaseClient,
          tenantId,
          normalized
        );

        // 4. Store event
        const { data: storedEvent, error: insertError } = await supabaseClient
          .from('security_events')
          .insert({
            tenant_id: tenantId,
            event_timestamp: normalized.event_timestamp,
            event_type: normalized.event_type,
            severity: normalized.severity,
            source_system: normalized.source_system,
            source_ip: normalized.source_ip,
            destination_ip: normalized.destination_ip,
            user_id: normalized.user_id,
            event_data: normalized.event_data,
            raw_log: normalized.raw_log,
            normalized_fields: normalized.normalized_fields,
            correlation_id: correlationId,
            threat_indicator_matched: threatMatch?.id,
            is_processed: false,
          })
          .select()
          .single();

        if (insertError) {
          console.error('[SIEM Processor] Insert error:', insertError);
          throw insertError;
        }

        console.log(`[SIEM Processor] Event stored: ${storedEvent.id}`);

        // 5. Create incident if critical
        if (normalized.severity === 'critical' || threatMatch) {
          await createSecurityIncident(supabaseClient, tenantId, storedEvent, threatMatch);
        }

        // 6. Trigger SOAR playbooks
        await triggerSOARPlaybooks(supabaseClient, tenantId, storedEvent);

        results.push({
          success: true,
          event_id: storedEvent.id,
          severity: normalized.severity,
          threat_match: !!threatMatch,
        });
      } catch (error) {
        console.error('[SIEM Processor] Event processing error:', error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          event: event,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`[SIEM Processor] Completed: ${successCount}/${events.length} succeeded`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: events.length,
        succeeded: successCount,
        failed: events.length - successCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[SIEM Processor] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Normalize security event into standard format
 */
function normalizeSecurityEvent(event: SecurityEventInput): NormalizedEvent {
  return {
    event_timestamp: event.timestamp || new Date().toISOString(),
    event_type: event.event_type,
    severity: event.severity || detectSeverity(event),
    source_system: event.source_system,
    source_ip: event.source_ip,
    destination_ip: event.destination_ip,
    user_id: event.user_id,
    event_data: event.event_data,
    raw_log: event.raw_log,
    normalized_fields: extractNormalizedFields(event),
  };
}

/**
 * Detect event severity based on content
 */
function detectSeverity(event: SecurityEventInput): 'info' | 'low' | 'medium' | 'high' | 'critical' {
  const eventType = event.event_type.toLowerCase();
  const rawLog = (event.raw_log || '').toLowerCase();

  // Critical indicators
  if (
    eventType.includes('breach') ||
    eventType.includes('ransomware') ||
    eventType.includes('intrusion') ||
    rawLog.includes('critical')
  ) {
    return 'critical';
  }

  // High indicators
  if (
    eventType.includes('attack') ||
    eventType.includes('malware') ||
    eventType.includes('unauthorized') ||
    rawLog.includes('high')
  ) {
    return 'high';
  }

  // Medium indicators
  if (
    eventType.includes('suspicious') ||
    eventType.includes('anomaly') ||
    eventType.includes('warning')
  ) {
    return 'medium';
  }

  // Low indicators
  if (eventType.includes('policy_violation') || eventType.includes('informational')) {
    return 'low';
  }

  return 'info';
}

/**
 * Extract normalized fields from event
 */
function extractNormalizedFields(event: SecurityEventInput): Record<string, any> {
  return {
    has_source_ip: !!event.source_ip,
    has_destination_ip: !!event.destination_ip,
    has_user_id: !!event.user_id,
    event_category: categorizeEvent(event.event_type),
    timestamp: event.timestamp || new Date().toISOString(),
  };
}

/**
 * Categorize event type
 */
function categorizeEvent(eventType: string): string {
  const type = eventType.toLowerCase();

  if (type.includes('login') || type.includes('auth')) return 'authentication';
  if (type.includes('network') || type.includes('traffic')) return 'network';
  if (type.includes('file') || type.includes('document')) return 'file_access';
  if (type.includes('malware') || type.includes('virus')) return 'malware';
  if (type.includes('firewall') || type.includes('block')) return 'firewall';
  if (type.includes('data') || type.includes('exfiltration')) return 'data_loss';

  return 'other';
}

/**
 * Check for threat intelligence matches
 */
async function checkThreatIndicators(
  supabase: any,
  tenantId: string,
  event: NormalizedEvent
): Promise<any> {
  // Check if threat_indicators table exists (from M20)
  // For now, return null as M20 is not yet implemented
  return null;

  // Future implementation when M20 is ready:
  /*
  const indicators = [];
  
  if (event.source_ip) indicators.push(event.source_ip);
  if (event.destination_ip) indicators.push(event.destination_ip);
  
  if (indicators.length === 0) return null;
  
  const { data } = await supabase
    .from('threat_indicators')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('indicator_value', indicators)
    .eq('is_active', true)
    .limit(1);
  
  return data?.[0] || null;
  */
}

/**
 * Correlate events based on patterns
 */
async function correlateEvents(
  supabase: any,
  tenantId: string,
  event: NormalizedEvent
): Promise<string | null> {
  // Look for similar events in the last hour
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const { data: recentEvents } = await supabase
    .from('security_events')
    .select('id, correlation_id, source_ip, event_type')
    .eq('tenant_id', tenantId)
    .gte('event_timestamp', oneHourAgo.toISOString())
    .limit(100);

  if (!recentEvents || recentEvents.length === 0) {
    return null;
  }

  // Check for existing correlation by source IP
  if (event.source_ip) {
    const matchingEvent = recentEvents.find(
      (e: any) => e.source_ip === event.source_ip && e.correlation_id
    );
    if (matchingEvent) {
      return matchingEvent.correlation_id;
    }
  }

  // Check for similar event types
  const similarEvents = recentEvents.filter(
    (e: any) => e.event_type === event.event_type && e.correlation_id
  );

  if (similarEvents.length > 0) {
    return similarEvents[0].correlation_id;
  }

  return null;
}

/**
 * Create security incident for critical events
 */
async function createSecurityIncident(
  supabase: any,
  tenantId: string,
  event: any,
  threatMatch: any
): Promise<void> {
  console.log(`[SIEM Processor] Creating incident for event: ${event.id}`);

  try {
    // Check if security_incidents table exists (from M18)
    const { data: incident, error } = await supabase
      .from('security_incidents')
      .insert({
        tenant_id: tenantId,
        title_ar: `حادث أمني: ${event.event_type}`,
        title_en: `Security Incident: ${event.event_type}`,
        description_ar: `حدث أمني حرج تم اكتشافه من ${event.source_system || 'نظام غير محدد'}`,
        description_en: `Critical security event detected from ${event.source_system || 'unknown system'}`,
        severity: event.severity,
        status: 'new',
        detected_at: event.event_timestamp,
        source: event.source_system || 'siem',
      })
      .select()
      .single();

    if (error) {
      console.error('[SIEM Processor] Incident creation error:', error);
      return;
    }

    // Link event to incident
    await supabase
      .from('security_events')
      .update({
        incident_id: incident.id,
        is_processed: true,
      })
      .eq('id', event.id);

    console.log(`[SIEM Processor] Incident created: ${incident.id}`);
  } catch (error) {
    console.error('[SIEM Processor] Incident creation failed:', error);
  }
}

/**
 * Trigger matching SOAR playbooks
 */
async function triggerSOARPlaybooks(
  supabase: any,
  tenantId: string,
  event: any
): Promise<void> {
  console.log(`[SIEM Processor] Checking SOAR playbooks for event: ${event.id}`);

  try {
    // Get active playbooks
    const { data: playbooks } = await supabase
      .from('soar_playbooks')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (!playbooks || playbooks.length === 0) {
      console.log('[SIEM Processor] No active playbooks found');
      return;
    }

    for (const playbook of playbooks) {
      if (shouldTriggerPlaybook(playbook, event)) {
        console.log(`[SIEM Processor] Triggering playbook: ${playbook.id}`);

        // Call SOAR orchestrator
        const orchestratorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/soar-orchestrator`;
        const response = await fetch(orchestratorUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            playbookId: playbook.id,
            eventId: event.id,
            autoTrigger: true,
          }),
        });

        if (!response.ok) {
          console.error('[SIEM Processor] Playbook trigger failed:', await response.text());
        } else {
          console.log('[SIEM Processor] Playbook triggered successfully');
        }
      }
    }
  } catch (error) {
    console.error('[SIEM Processor] Playbook trigger error:', error);
  }
}

/**
 * Check if playbook should be triggered for this event
 */
function shouldTriggerPlaybook(playbook: any, event: any): boolean {
  const conditions = playbook.trigger_conditions;

  // Check event type match
  if (conditions.event_type && Array.isArray(conditions.event_type)) {
    if (!conditions.event_type.includes(event.event_type)) {
      return false;
    }
  }

  // Check severity match
  if (conditions.severity && Array.isArray(conditions.severity)) {
    if (!conditions.severity.includes(event.severity)) {
      return false;
    }
  }

  // Check source system match
  if (conditions.source_system && Array.isArray(conditions.source_system)) {
    if (!conditions.source_system.includes(event.source_system)) {
      return false;
    }
  }

  return true;
}
