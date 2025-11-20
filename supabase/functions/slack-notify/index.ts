/**
 * Slack Notify Edge Function
 * Gate-M15: Send notifications to Slack channels
 * 
 * Endpoint: POST /functions/v1/slack-notify
 * Body: {
 *   connector_id: string;
 *   message: string;
 *   attachments?: SlackAttachment[];
 *   blocks?: SlackBlock[];
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SlackAttachment {
  color?: string;
  title?: string;
  text?: string;
  fields?: { title: string; value: string; short?: boolean }[];
}

interface SlackBlock {
  type: string;
  [key: string]: any;
}

interface RequestBody {
  connector_id: string;
  message: string;
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { connector_id, message, attachments, blocks } = body;

    if (!connector_id || !message) {
      return new Response(
        JSON.stringify({ error: 'connector_id and message are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get connector configuration
    const { data: connector, error: connectorError } = await supabase
      .from('integration_connectors')
      .select('*')
      .eq('id', connector_id)
      .eq('type', 'slack')
      .eq('status', 'active')
      .single();

    if (connectorError || !connector) {
      console.error('Connector not found:', connectorError);
      return new Response(
        JSON.stringify({ error: 'Slack connector not found or inactive' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const config = connector.config as { webhook_url: string; channel?: string };
    const webhookUrl = config.webhook_url;

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Webhook URL not configured for this connector' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare Slack payload
    const slackPayload: any = {
      text: message,
    };

    if (config.channel) {
      slackPayload.channel = config.channel;
    }

    if (attachments) {
      slackPayload.attachments = attachments;
    }

    if (blocks) {
      slackPayload.blocks = blocks;
    }

    // Send to Slack
    const startTime = Date.now();
    const slackResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });

    const duration = Date.now() - startTime;
    const success = slackResponse.ok;

    // Log the event
    await supabase.from('integration_logs').insert({
      tenant_id: connector.tenant_id,
      connector_id: connector.id,
      event_type: 'slack.notification',
      event_category: 'notification',
      payload: { message, attachments, blocks },
      response: {
        status: slackResponse.status,
        statusText: slackResponse.statusText,
      },
      status: success ? 'success' : 'failed',
      error_message: success ? null : `Slack returned ${slackResponse.status}`,
      duration_ms: duration,
    });

    if (!success) {
      const errorText = await slackResponse.text();
      return new Response(
        JSON.stringify({
          error: 'Failed to send Slack notification',
          details: errorText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent to Slack successfully',
        duration_ms: duration,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Slack notify error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
