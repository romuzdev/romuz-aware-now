/**
 * M18: Incident Cloud Events Receiver
 * Receives security events from Cloud Providers
 * Supports: AWS GuardDuty, Azure Security Center, GCP Security Command Center
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-amz-sns-message-type, x-azure-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Detect cloud provider from headers
    const snsMessageType = req.headers.get('x-amz-sns-message-type');
    const azureSignature = req.headers.get('x-azure-signature');
    
    let provider: string;
    let payload: any;
    
    if (snsMessageType) {
      // AWS SNS notification
      provider = 'aws';
      payload = await handleAWSSNS(req, snsMessageType);
    } else if (azureSignature) {
      // Azure Event Grid
      provider = 'azure';
      payload = await handleAzureEventGrid(req, azureSignature);
    } else {
      // Generic cloud event or GCP
      provider = 'gcp';
      payload = await req.json();
    }

    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid cloud event payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find integration for this cloud provider
    const { data: integrations } = await supabase
      .from('incident_integrations')
      .select('*')
      .eq('integration_type', 'cloud_provider')
      .eq('is_active', true)
      .ilike('provider', `%${provider}%`);

    if (!integrations || integrations.length === 0) {
      console.log(`⚠️ No active integration found for ${provider}`);
      return new Response(
        JSON.stringify({ message: 'Event received but no integration configured', provider }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const integration = integrations[0];

    // Forward to webhook receiver
    const { data: webhookResult, error: webhookError } = await supabase.functions.invoke(
      'incident-webhook-receiver',
      {
        body: {
          integration_id: integration.id,
          source: provider,
          alert_data: payload,
        },
      }
    );

    if (webhookError) {
      console.error('❌ Failed to process cloud event:', webhookError);
      return new Response(
        JSON.stringify({ error: webhookError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Cloud event processed from ${provider}:`, webhookResult);

    return new Response(
      JSON.stringify({
        success: true,
        provider,
        ...webhookResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Cloud events error:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handle AWS SNS notifications
 */
async function handleAWSSNS(req: Request, messageType: string): Promise<any> {
  const body = await req.json();

  // SNS Subscription Confirmation
  if (messageType === 'SubscriptionConfirmation') {
    console.log('📧 AWS SNS Subscription Confirmation received');
    
    // Auto-confirm subscription
    if (body.SubscribeURL) {
      const confirmResponse = await fetch(body.SubscribeURL);
      if (confirmResponse.ok) {
        console.log('✅ AWS SNS subscription confirmed');
      }
    }
    
    return null; // Don't process as incident
  }

  // SNS Notification
  if (messageType === 'Notification') {
    const message = typeof body.Message === 'string' ? JSON.parse(body.Message) : body.Message;
    
    // GuardDuty finding
    if (message.detail && message['detail-type'] === 'GuardDuty Finding') {
      return {
        id: message.detail.id,
        title: message.detail.title,
        description: message.detail.description,
        severity: message.detail.severity,
        type: message.detail.type,
        resource: message.detail.resource,
        service: message.detail.service,
        region: message.region,
        account: message.account,
        time: message.time,
      };
    }

    // Security Hub finding
    if (message.detail && message['detail-type'] === 'Security Hub Findings - Imported') {
      const finding = message.detail.findings[0];
      return {
        id: finding.Id,
        title: finding.Title,
        description: finding.Description,
        severity: finding.Severity?.Label,
        type: finding.Types?.[0],
        resource: finding.Resources?.[0],
        compliance: finding.Compliance,
        remediation: finding.Remediation,
      };
    }

    return message;
  }

  return body;
}

/**
 * Handle Azure Event Grid events
 */
async function handleAzureEventGrid(req: Request, signature: string): Promise<any> {
  const events = await req.json();

  // Event Grid Validation
  if (Array.isArray(events) && events[0]?.eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent') {
    console.log('📧 Azure Event Grid validation received');
    return null; // Return validation response separately
  }

  // Security alerts from Azure Security Center
  if (Array.isArray(events)) {
    const securityAlerts = events.filter(e => 
      e.eventType === 'Microsoft.Security.AlertsGenerated' ||
      e.data?.alertType
    );

    if (securityAlerts.length > 0) {
      return securityAlerts.map(alert => ({
        id: alert.data?.systemAlertId || alert.id,
        title: alert.data?.alertDisplayName || alert.subject,
        description: alert.data?.description,
        severity: alert.data?.severity,
        status: alert.data?.status,
        remediation: alert.data?.remediationSteps,
        entities: alert.data?.entities,
        time: alert.eventTime,
      }));
    }
  }

  return events;
}
