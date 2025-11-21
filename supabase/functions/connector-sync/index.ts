/**
 * Connector Sync Edge Function
 * M18.5 - SecOps Integration
 * 
 * Purpose:
 * 1. Synchronize data from external security solutions
 * 2. Import logs, events, and alerts
 * 3. Update connector sync status
 * 4. Handle errors and retries
 * 5. Schedule next sync
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getTenantId } from '../_shared/tenant-utils.ts';

interface SyncRequest {
  connectorId: string;
  force?: boolean; // Force sync even if not due
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Connector Sync] Starting synchronization...');

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
    console.log(`[Connector Sync] Syncing for tenant: ${tenantId}`);

    // Parse request
    const { connectorId, force }: SyncRequest = await req.json();

    if (!connectorId) {
      throw new Error('connectorId is required');
    }

    // 1. Fetch connector configuration
    const { data: connector, error: connectorError } = await supabaseClient
      .from('secops_connectors')
      .select('*')
      .eq('id', connectorId)
      .eq('tenant_id', tenantId)
      .single();

    if (connectorError || !connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    console.log(`[Connector Sync] Connector loaded: ${connector.name_ar}`);

    // Check if connector is active
    if (!connector.is_active) {
      throw new Error('Connector is not active');
    }

    // Check if sync is due (unless forced)
    if (!force && connector.next_sync_at) {
      const nextSync = new Date(connector.next_sync_at);
      if (nextSync > new Date()) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Sync not due yet',
            next_sync_at: connector.next_sync_at,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 2. Create sync log entry
    const { data: syncLog, error: logError } = await supabaseClient
      .from('secops_connector_sync_logs')
      .insert({
        tenant_id: tenantId,
        connector_id: connectorId,
        status: 'started',
        sync_started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError || !syncLog) {
      throw new Error('Failed to create sync log');
    }

    // 3. Update connector status to syncing
    await supabaseClient
      .from('secops_connectors')
      .update({
        sync_status: 'syncing',
      })
      .eq('id', connectorId);

    console.log(`[Connector Sync] Sync started: ${syncLog.id}`);

    // 4. Perform sync based on connector type
    let syncResult;
    try {
      syncResult = await performSync(connector, supabaseClient, tenantId);

      console.log(
        `[Connector Sync] Sync completed: ${syncResult.records_imported} records imported`
      );

      // 5. Update sync log with success
      await supabaseClient
        .from('secops_connector_sync_logs')
        .update({
          status: 'success',
          sync_completed_at: new Date().toISOString(),
          records_processed: syncResult.records_processed,
          records_imported: syncResult.records_imported,
          records_failed: syncResult.records_failed,
          sync_details: syncResult.details,
        })
        .eq('id', syncLog.id);

      // 6. Update connector status
      const nextSync = new Date();
      nextSync.setMinutes(nextSync.getMinutes() + connector.sync_interval_minutes);

      await supabaseClient
        .from('secops_connectors')
        .update({
          sync_status: 'success',
          last_sync_at: new Date().toISOString(),
          last_sync_result: syncResult.details,
          next_sync_at: nextSync.toISOString(),
          error_count: 0,
          last_error: null,
        })
        .eq('id', connectorId);

      return new Response(
        JSON.stringify({
          success: true,
          sync_log_id: syncLog.id,
          records_imported: syncResult.records_imported,
          next_sync_at: nextSync.toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (syncError) {
      console.error('[Connector Sync] Sync failed:', syncError);

      // Update sync log with error
      await supabaseClient
        .from('secops_connector_sync_logs')
        .update({
          status: 'error',
          sync_completed_at: new Date().toISOString(),
          error_message: syncError instanceof Error ? syncError.message : 'Unknown error',
        })
        .eq('id', syncLog.id);

      // Update connector with error
      const errorCount = connector.error_count + 1;
      await supabaseClient
        .from('secops_connectors')
        .update({
          sync_status: 'error',
          error_count: errorCount,
          last_error: syncError instanceof Error ? syncError.message : 'Unknown error',
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', connectorId);

      throw syncError;
    }
  } catch (error) {
    console.error('[Connector Sync] Error:', error);
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
 * Perform sync based on connector type
 */
async function performSync(
  connector: any,
  supabase: any,
  tenantId: string
): Promise<{
  records_processed: number;
  records_imported: number;
  records_failed: number;
  details: Record<string, any>;
}> {
  console.log(`[Connector Sync] Syncing ${connector.connector_type}...`);

  switch (connector.connector_type) {
    case 'firewall':
      return await syncFirewall(connector, supabase, tenantId);

    case 'siem':
      return await syncSIEM(connector, supabase, tenantId);

    case 'ids_ips':
      return await syncIDSIPS(connector, supabase, tenantId);

    case 'endpoint_protection':
      return await syncEndpointProtection(connector, supabase, tenantId);

    case 'dlp':
      return await syncDLP(connector, supabase, tenantId);

    case 'email_security':
      return await syncEmailSecurity(connector, supabase, tenantId);

    default:
      return await syncGeneric(connector, supabase, tenantId);
  }
}

/**
 * Sync Firewall logs
 */
async function syncFirewall(
  connector: any,
  supabase: any,
  tenantId: string
): Promise<any> {
  console.log('[Connector Sync] Syncing firewall logs...');

  // TODO: Integrate with actual firewall API
  // For now, return simulated data

  return {
    records_processed: 0,
    records_imported: 0,
    records_failed: 0,
    details: {
      message: 'Firewall sync simulation (integration pending)',
      connector_type: 'firewall',
      vendor: connector.vendor,
    },
  };
}

/**
 * Sync SIEM events
 */
async function syncSIEM(
  connector: any,
  supabase: any,
  tenantId: string
): Promise<any> {
  console.log('[Connector Sync] Syncing SIEM events...');

  // TODO: Integrate with actual SIEM API
  // For now, return simulated data

  return {
    records_processed: 0,
    records_imported: 0,
    records_failed: 0,
    details: {
      message: 'SIEM sync simulation (integration pending)',
      connector_type: 'siem',
      vendor: connector.vendor,
    },
  };
}

/**
 * Sync IDS/IPS alerts
 */
async function syncIDSIPS(
  connector: any,
  supabase: any,
  tenantId: string
): Promise<any> {
  console.log('[Connector Sync] Syncing IDS/IPS alerts...');

  // TODO: Integrate with actual IDS/IPS API
  // For now, return simulated data

  return {
    records_processed: 0,
    records_imported: 0,
    records_failed: 0,
    details: {
      message: 'IDS/IPS sync simulation (integration pending)',
      connector_type: 'ids_ips',
      vendor: connector.vendor,
    },
  };
}

/**
 * Sync Endpoint Protection events
 */
async function syncEndpointProtection(
  connector: any,
  supabase: any,
  tenantId: string
): Promise<any> {
  console.log('[Connector Sync] Syncing endpoint protection events...');

  // TODO: Integrate with actual endpoint protection API
  // For now, return simulated data

  return {
    records_processed: 0,
    records_imported: 0,
    records_failed: 0,
    details: {
      message: 'Endpoint protection sync simulation (integration pending)',
      connector_type: 'endpoint_protection',
      vendor: connector.vendor,
    },
  };
}

/**
 * Sync DLP events
 */
async function syncDLP(
  connector: any,
  supabase: any,
  tenantId: string
): Promise<any> {
  console.log('[Connector Sync] Syncing DLP events...');

  // TODO: Integrate with actual DLP API
  // For now, return simulated data

  return {
    records_processed: 0,
    records_imported: 0,
    records_failed: 0,
    details: {
      message: 'DLP sync simulation (integration pending)',
      connector_type: 'dlp',
      vendor: connector.vendor,
    },
  };
}

/**
 * Sync Email Security events
 */
async function syncEmailSecurity(
  connector: any,
  supabase: any,
  tenantId: string
): Promise<any> {
  console.log('[Connector Sync] Syncing email security events...');

  // TODO: Integrate with actual email security API
  // For now, return simulated data

  return {
    records_processed: 0,
    records_imported: 0,
    records_failed: 0,
    details: {
      message: 'Email security sync simulation (integration pending)',
      connector_type: 'email_security',
      vendor: connector.vendor,
    },
  };
}

/**
 * Generic sync for other connector types
 */
async function syncGeneric(
  connector: any,
  supabase: any,
  tenantId: string
): Promise<any> {
  console.log('[Connector Sync] Syncing generic connector...');

  return {
    records_processed: 0,
    records_imported: 0,
    records_failed: 0,
    details: {
      message: 'Generic sync simulation (integration pending)',
      connector_type: connector.connector_type,
      vendor: connector.vendor,
    },
  };
}
