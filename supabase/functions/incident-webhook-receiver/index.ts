/**
 * M18: Incident Webhook Receiver
 * Receives webhooks from external systems and creates incidents
 * Supports: SIEM, Cloud Providers, Security Tools, Custom Webhooks
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-integration-id',
};

interface WebhookPayload {
  integration_id?: string;
  source?: string;
  alert_data: any;
  severity?: string;
  event_type?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract headers
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const integrationId = req.headers.get('x-integration-id');
    const signature = req.headers.get('x-webhook-signature');
    const sourceIp = req.headers.get('x-forwarded-for') || 'unknown';

    // Parse payload
    let payload: WebhookPayload;
    let rawPayload: any;
    
    try {
      rawPayload = await req.json();
      payload = rawPayload as WebhookPayload;
    } catch (e) {
      console.error('❌ Invalid JSON payload:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine tenant_id and integration
    let tenantId: string | null = null;
    let integration: any = null;

    if (integrationId) {
      const { data: integrationData } = await supabase
        .from('incident_integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('is_active', true)
        .single();

      if (integrationData) {
        integration = integrationData;
        tenantId = integrationData.tenant_id;
      }
    }

    // If no integration found, try to match by source identifier
    if (!tenantId) {
      const webhookSource = payload.source || 'unknown';
      const { data: integrationsBySource } = await supabase
        .from('incident_integrations')
        .select('*')
        .eq('is_active', true)
        .ilike('provider', `%${webhookSource}%`)
        .limit(1);

      if (integrationsBySource && integrationsBySource.length > 0) {
        integration = integrationsBySource[0];
        tenantId = integration.tenant_id;
      }
    }

    // Log webhook (even if tenant not found for debugging)
    const webhookLogId = crypto.randomUUID();
    await supabase.from('incident_webhook_logs').insert({
      id: webhookLogId,
      tenant_id: tenantId || '00000000-0000-0000-0000-000000000000',
      integration_id: integration?.id || null,
      webhook_source: payload.source || 'unknown',
      source_identifier: sourceIp,
      http_method: req.method,
      headers: headers,
      raw_payload: rawPayload,
      processing_status: 'pending',
      received_at: new Date().toISOString(),
    });

    // If no tenant found, return error
    if (!tenantId) {
      await supabase.from('incident_webhook_logs').update({
        processing_status: 'failed',
        processing_error: 'No active integration found for this webhook',
        processed_at: new Date().toISOString(),
      }).eq('id', webhookLogId);

      return new Response(
        JSON.stringify({ error: 'No active integration found', webhook_log_id: webhookLogId }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify signature if configured
    if (integration.auth_type === 'webhook_signature' && signature) {
      // TODO: Implement signature verification
      console.log('🔐 Signature verification enabled (not yet implemented)');
    }

    // Parse alert data and create incident
    const alertData = payload.alert_data || payload;
    const parsedData = parseWebhookData(alertData, integration);

    // Call AI auto-detect for classification
    let classification: any = null;
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke('incident-auto-detect', {
        body: {
          source: integration.provider,
          alert_data: parsedData,
          severity: parsedData.severity || 'medium',
        }
      });

      if (!aiError && aiData) {
        classification = aiData;
      }
    } catch (aiErr) {
      console.error('⚠️ AI classification failed:', aiErr);
      // Continue without AI classification
    }

    // Create incident
    const incidentData = {
      tenant_id: tenantId,
      incident_number: `INC-${Date.now()}`,
      title: classification?.title || parsedData.title || alertData.alert_name || 'Incident from External Source',
      description: classification?.description || parsedData.description || JSON.stringify(alertData),
      severity: classification?.severity || parsedData.severity || 'medium',
      status: 'new',
      category: classification?.category || parsedData.category || 'security',
      detection_method: 'external_integration',
      source_system: integration.provider,
      context_type: 'webhook',
      context_id: webhookLogId,
      detected_at: new Date().toISOString(),
      created_by: integration.created_by,
    };

    const { data: incident, error: incidentError } = await supabase
      .from('security_incidents')
      .insert(incidentData)
      .select()
      .single();

    if (incidentError) {
      console.error('❌ Failed to create incident:', incidentError);
      
      await supabase.from('incident_webhook_logs').update({
        processing_status: 'failed',
        processing_error: incidentError.message,
        processing_duration_ms: Date.now() - startTime,
        processed_at: new Date().toISOString(),
      }).eq('id', webhookLogId);

      return new Response(
        JSON.stringify({ error: incidentError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update webhook log with success
    await supabase.from('incident_webhook_logs').update({
      processing_status: 'processed',
      processing_duration_ms: Date.now() - startTime,
      incident_id: incident.id,
      action_taken: 'created_incident',
      parsed_payload: parsedData,
      processed_at: new Date().toISOString(),
    }).eq('id', webhookLogId);

    // Update integration statistics
    await supabase.from('incident_integrations').update({
      total_events_received: (integration.total_events_received || 0) + 1,
      last_event_at: new Date().toISOString(),
      sync_status: 'idle',
    }).eq('id', integration.id);

    // Create timeline event
    await supabase.from('incident_timeline').insert({
      incident_id: incident.id,
      tenant_id: tenantId,
      event_type: 'incident_created',
      event_description: `Incident created from ${integration.provider} webhook`,
      actor: 'system',
      metadata: { webhook_log_id: webhookLogId, integration_id: integration.id },
    });

    console.log(`✅ Incident created: ${incident.id} from ${integration.provider}`);

    return new Response(
      JSON.stringify({
        success: true,
        incident_id: incident.id,
        incident_number: incident.incident_number,
        webhook_log_id: webhookLogId,
        processing_time_ms: Date.now() - startTime,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Parse webhook data based on provider
 */
function parseWebhookData(alertData: any, integration: any): any {
  const provider = integration.provider.toLowerCase();
  const fieldMapping = integration.field_mapping || {};
  const severityMapping = integration.severity_mapping || {};

  let parsed: any = {
    title: null,
    description: null,
    severity: null,
    category: null,
    raw_data: alertData,
  };

  // Provider-specific parsing
  if (provider.includes('splunk')) {
    parsed.title = alertData.search_name || alertData.alert_name;
    parsed.description = alertData.result?.message || alertData.sid;
    parsed.severity = mapSeverity(alertData.severity || alertData.urgency, severityMapping);
    parsed.category = alertData.app || 'security';
  } 
  else if (provider.includes('qradar')) {
    parsed.title = alertData.offense_name || alertData.description;
    parsed.description = alertData.description;
    parsed.severity = mapSeverity(alertData.severity, severityMapping);
    parsed.category = alertData.category_name || 'security';
  }
  else if (provider.includes('aws') || provider.includes('guardduty')) {
    parsed.title = alertData.Title || alertData.title;
    parsed.description = alertData.Description || alertData.description;
    parsed.severity = mapSeverity(alertData.Severity?.Label || alertData.severity, severityMapping);
    parsed.category = alertData.Type || 'aws_security';
  }
  else if (provider.includes('azure')) {
    parsed.title = alertData.properties?.alertDisplayName || alertData.name;
    parsed.description = alertData.properties?.description;
    parsed.severity = mapSeverity(alertData.properties?.severity, severityMapping);
    parsed.category = alertData.type || 'azure_security';
  }
  else if (provider.includes('elk') || provider.includes('elastic')) {
    parsed.title = alertData._source?.rule?.name || alertData.alert_name;
    parsed.description = alertData._source?.message;
    parsed.severity = mapSeverity(alertData._source?.severity || alertData.severity, severityMapping);
    parsed.category = alertData._source?.category || 'log_analysis';
  }
  else {
    // Generic parsing
    parsed.title = alertData.title || alertData.name || alertData.alert_name;
    parsed.description = alertData.description || alertData.message;
    parsed.severity = mapSeverity(alertData.severity, severityMapping);
    parsed.category = alertData.category || alertData.type || 'general';
  }

  // Apply custom field mapping if configured
  if (Object.keys(fieldMapping).length > 0) {
    for (const [targetField, sourceField] of Object.entries(fieldMapping)) {
      const sourcePath = sourceField as string;
      const targetPath = targetField as string;
      if (alertData[sourcePath]) {
        parsed[targetPath] = alertData[sourcePath];
      }
    }
  }

  return parsed;
}

/**
 * Map external severity to our severity levels
 */
function mapSeverity(externalSeverity: any, severityMapping: any): string {
  if (!externalSeverity) return 'medium';
  
  const severity = String(externalSeverity).toLowerCase();
  
  // Use custom mapping if provided
  if (severityMapping[severity]) {
    return severityMapping[severity];
  }

  // Default mapping
  if (severity.includes('crit') || severity.includes('high') || severity === '5' || severity === '4') {
    return 'critical';
  } else if (severity.includes('med') || severity === '3') {
    return 'medium';
  } else if (severity.includes('low') || severity === '2' || severity === '1') {
    return 'low';
  }

  return 'medium';
}
