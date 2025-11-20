/**
 * Google Drive Sync Edge Function
 * Gate-M15: Syncs files and documents from Google Drive
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleDriveConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  refresh_token: string;
}

interface SyncRequest {
  connector_id: string;
  folder_id?: string;
  sync_mode?: 'full' | 'incremental';
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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { connector_id, folder_id, sync_mode = 'incremental' }: SyncRequest = await req.json();

    // Fetch connector configuration
    const { data: connector, error: connectorError } = await supabaseClient
      .from('integration_connectors')
      .select('*')
      .eq('id', connector_id)
      .eq('type', 'google_workspace')
      .single();

    if (connectorError || !connector) {
      throw new Error('Connector not found');
    }

    const config = connector.config as GoogleDriveConfig;
    const startTime = Date.now();

    // Get access token from refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.client_id,
        client_secret: config.client_secret,
        refresh_token: config.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh Google access token');
    }

    const { access_token } = await tokenResponse.json();

    // Fetch files from Google Drive
    const driveUrl = new URL('https://www.googleapis.com/drive/v3/files');
    driveUrl.searchParams.set('fields', 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink)');
    driveUrl.searchParams.set('pageSize', '100');
    
    if (folder_id) {
      driveUrl.searchParams.set('q', `'${folder_id}' in parents`);
    }

    const driveResponse = await fetch(driveUrl.toString(), {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!driveResponse.ok) {
      throw new Error('Failed to fetch Google Drive files');
    }

    const { files } = await driveResponse.json();
    const duration = Date.now() - startTime;

    // Log sync event
    await supabaseClient.from('integration_logs').insert({
      tenant_id: connector.tenant_id,
      connector_id: connector.id,
      event_type: 'google_drive_sync',
      event_category: 'sync',
      payload: { folder_id, sync_mode, files_count: files.length },
      response: { files },
      status: 'success',
      duration_ms: duration,
    });

    // Update last sync timestamp
    await supabaseClient
      .from('integration_connectors')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connector_id);

    return new Response(
      JSON.stringify({
        success: true,
        files_synced: files.length,
        duration_ms: duration,
        files,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Google Drive Sync error:', error);

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
