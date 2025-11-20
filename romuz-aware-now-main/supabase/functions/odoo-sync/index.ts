/**
 * Odoo ERP Sync Edge Function
 * Gate-M15: Syncs employee and department data from Odoo
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OdooConfig {
  url: string;
  database: string;
  username: string;
  api_key: string;
}

interface OdooSyncRequest {
  connector_id: string;
  sync_type: 'employees' | 'departments' | 'all';
}

async function odooAuthenticate(config: OdooConfig): Promise<number> {
  const response = await fetch(`${config.url}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        db: config.database,
        login: config.username,
        password: config.api_key,
      },
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Odoo authentication failed: ${data.error.data.message}`);
  }

  return data.result.uid;
}

async function odooSearchRead(
  config: OdooConfig,
  uid: number,
  model: string,
  fields: string[]
): Promise<any[]> {
  const response = await fetch(`${config.url}/web/dataset/search_read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model,
        fields,
        domain: [],
        limit: 1000,
        context: {
          lang: 'ar_SA',
        },
      },
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Odoo search_read failed: ${data.error.data.message}`);
  }

  return data.result.records;
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

    const { connector_id, sync_type }: OdooSyncRequest = await req.json();
    const startTime = Date.now();

    // Fetch connector configuration
    const { data: connector, error: connectorError } = await supabaseClient
      .from('integration_connectors')
      .select('*')
      .eq('id', connector_id)
      .eq('type', 'odoo')
      .single();

    if (connectorError || !connector) {
      throw new Error('Connector not found');
    }

    const config = connector.config as OdooConfig;

    // Authenticate with Odoo
    const uid = await odooAuthenticate(config);
    console.log(`✅ Authenticated with Odoo as user ID: ${uid}`);

    const syncResults: any = {
      employees: 0,
      departments: 0,
    };

    // Sync departments if requested
    if (sync_type === 'departments' || sync_type === 'all') {
      const departments = await odooSearchRead(
        config,
        uid,
        'hr.department',
        ['id', 'name', 'parent_id', 'manager_id']
      );

      syncResults.departments = departments.length;
      console.log(`✅ Synced ${departments.length} departments from Odoo`);
    }

    // Sync employees if requested
    if (sync_type === 'employees' || sync_type === 'all') {
      const employees = await odooSearchRead(
        config,
        uid,
        'hr.employee',
        ['id', 'name', 'work_email', 'department_id', 'job_title']
      );

      syncResults.employees = employees.length;
      console.log(`✅ Synced ${employees.length} employees from Odoo`);
    }

    const duration = Date.now() - startTime;

    // Log sync event
    await supabaseClient.from('integration_logs').insert({
      tenant_id: connector.tenant_id,
      connector_id: connector.id,
      event_type: 'odoo_sync',
      event_category: 'sync',
      payload: { sync_type },
      response: syncResults,
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
        sync_type,
        ...syncResults,
        duration_ms: duration,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Odoo Sync error:', error);

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
