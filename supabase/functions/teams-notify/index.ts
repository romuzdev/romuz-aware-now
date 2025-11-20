/**
 * ============================================================================
 * M15 - Microsoft Teams Notification Integration
 * Purpose: Send notifications to Microsoft Teams channels
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface TeamsMessage {
  connector_id: string;
  title: string;
  text: string;
  sections?: Array<{
    activityTitle?: string;
    activitySubtitle?: string;
    activityImage?: string;
    facts?: Array<{ name: string; value: string }>;
    markdown?: boolean;
  }>;
  actions?: Array<{
    type: string;
    title: string;
    url?: string;
  }>;
  theme_color?: string;
}

interface TeamsConnectorConfig {
  webhook_url: string;
  channel_name?: string;
  retry_enabled?: boolean;
  max_retries?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { connector_id, title, text, sections, actions, theme_color }: TeamsMessage = await req.json();

    if (!connector_id || !title || !text) {
      throw new Error('Missing required fields: connector_id, title, text');
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch Teams connector configuration
    const { data: connector, error: connectorError } = await supabase
      .from('integration_connectors')
      .select('*')
      .eq('id', connector_id)
      .eq('type', 'teams')
      .eq('status', 'active')
      .single();

    if (connectorError || !connector) {
      throw new Error('Teams connector not found or inactive');
    }

    const config = connector.config as TeamsConnectorConfig;
    if (!config.webhook_url) {
      throw new Error('Teams webhook URL not configured');
    }

    // Build Teams message card (MessageCard format)
    const messageCard = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      themeColor: theme_color || '0078D4',
      summary: title,
      sections: [
        {
          activityTitle: title,
          activitySubtitle: new Date().toLocaleString('ar-SA'),
          text: text,
        },
        ...(sections || []),
      ],
      potentialAction: actions?.map(action => ({
        '@type': 'OpenUri',
        name: action.title,
        targets: [
          {
            os: 'default',
            uri: action.url,
          },
        ],
      })) || [],
    };

    // Send to Teams with retry logic
    const maxRetries = config.retry_enabled ? (config.max_retries || 3) : 1;
    let lastError: Error | null = null;
    let success = false;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageCard),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Teams API error: ${response.status} - ${errorText}`);
        }

        success = true;
        break;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    if (!success && lastError) {
      throw lastError;
    }

    // Log success
    await supabase.from('integration_logs').insert({
      tenant_id: connector.tenant_id,
      connector_id: connector.id,
      status: 'success',
      category: 'notification',
      message: `Teams notification sent: ${title}`,
      metadata: {
        title,
        sections_count: sections?.length || 0,
        actions_count: actions?.length || 0,
      },
    });

    // Update last sync timestamp
    await supabase
      .from('integration_connectors')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connector_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Teams notification sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Teams notification error:', error);
    const err = error as Error;

    // Log error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const body = await req.json();
      if (body.connector_id) {
        const { data: connector } = await supabase
          .from('integration_connectors')
          .select('tenant_id')
          .eq('id', body.connector_id)
          .single();

        if (connector) {
          await supabase.from('integration_logs').insert({
            tenant_id: connector.tenant_id,
            connector_id: body.connector_id,
            status: 'failed',
            category: 'notification',
            message: `Teams notification failed: ${err.message}`,
            error_message: err.stack || err.message,
          });
        }
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        error: 'Teams notification failed',
        details: err.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
