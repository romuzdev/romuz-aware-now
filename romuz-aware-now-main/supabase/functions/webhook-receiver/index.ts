/**
 * Webhook Receiver Edge Function
 * Gate-M15: Receives and processes incoming webhooks
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

interface WebhookPayload {
  webhook_id: string;
  event: string;
  data: any;
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const computed = hmac.digest('hex');
  return computed === signature;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawPayload = await req.text();
    const signature = req.headers.get('x-webhook-signature') || '';
    const { webhook_id, event, data }: WebhookPayload = JSON.parse(rawPayload);

    if (!webhook_id) {
      throw new Error('Missing webhook_id');
    }

    const startTime = Date.now();

    // Fetch webhook configuration
    const { data: webhook, error: webhookError } = await supabaseClient
      .from('integration_webhooks')
      .select('*')
      .eq('id', webhook_id)
      .eq('active', true)
      .single();

    if (webhookError || !webhook) {
      throw new Error('Webhook not found or inactive');
    }

    // Verify signature if required
    if (webhook.verify_signature && signature) {
      const isValid = verifySignature(rawPayload, signature, webhook.secret);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    // Check if event is allowed
    if (webhook.events.length > 0 && !webhook.events.includes(event)) {
      throw new Error(`Event '${event}' not allowed for this webhook`);
    }

    const duration = Date.now() - startTime;

    // Log webhook event
    await supabaseClient.from('integration_logs').insert({
      tenant_id: webhook.tenant_id,
      connector_id: webhook.connector_id,
      event_type: event,
      event_category: 'webhook',
      payload: { webhook_id, event, data },
      status: 'success',
      duration_ms: duration,
    });

    // Trigger automation rules if needed
    // TODO: Integrate with automation_rules table

    return new Response(
      JSON.stringify({
        success: true,
        webhook_id,
        event,
        received_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Webhook Receiver error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
