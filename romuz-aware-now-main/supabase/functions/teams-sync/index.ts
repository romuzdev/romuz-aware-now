/**
 * ============================================================================
 * M15 - Microsoft Teams Sync Integration
 * Purpose: Sync Teams channels and users metadata
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TeamsSyncRequest {
  connector_id: string;
  sync_type: 'channels' | 'users' | 'both';
}

interface TeamsConfig {
  webhook_url: string;
  tenant_id: string;
  client_id?: string;
  client_secret?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { connector_id, sync_type }: TeamsSyncRequest = await req.json();

    if (!connector_id || !sync_type) {
      throw new Error('Missing required fields: connector_id, sync_type');
    }

    // Fetch connector
    const { data: connector, error: connectorError } = await supabase
      .from('integration_connectors')
      .select('*')
      .eq('id', connector_id)
      .eq('type', 'teams')
      .single();

    if (connectorError || !connector) {
      throw new Error('Teams connector not found');
    }

    const config = connector.config as TeamsConfig;
    const syncedData: any = {
      channels: [],
      users: [],
      sync_type,
      synced_at: new Date().toISOString(),
    };

    // Note: Full Teams Graph API integration requires OAuth tokens
    // For MVP, we'll store webhook metadata
    if (sync_type === 'channels' || sync_type === 'both') {
      syncedData.channels = [{
        webhook_url: config.webhook_url,
        status: 'configured',
      }];
    }

    // Log sync event
    await supabase.from('integration_logs').insert({
      tenant_id: connector.tenant_id,
      connector_id: connector.id,
      status: 'success',
      category: 'sync',
      message: `Teams sync completed: ${sync_type}`,
      metadata: syncedData,
    });

    // Update last sync
    await supabase
      .from('integration_connectors')
      .update({ 
        last_sync_at: new Date().toISOString(),
        config: {
          ...config,
          last_sync_data: syncedData,
        },
      })
      .eq('id', connector_id);

    return new Response(
      JSON.stringify({
        success: true,
        synced_data: syncedData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Teams sync error:', error);
    const err = error as Error;

    return new Response(
      JSON.stringify({
        error: 'Teams sync failed',
        details: err.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
