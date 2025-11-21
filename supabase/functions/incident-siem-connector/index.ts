/**
 * M18: Incident SIEM Connector
 * Active polling connector for SIEM systems
 * Supports: Splunk, QRadar, ArcSight, LogRhythm
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SIEMFetchRequest {
  integration_id: string;
  fetch_window_minutes?: number; // Default: 15 minutes
  max_alerts?: number; // Default: 100
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: SIEMFetchRequest = await req.json();
    const { integration_id, fetch_window_minutes = 15, max_alerts = 100 } = body;

    // Get integration configuration
    const { data: integration, error: integrationError } = await supabase
      .from('incident_integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Integration not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update sync status
    await supabase.from('incident_integrations').update({
      sync_status: 'syncing',
      last_sync_at: new Date().toISOString(),
    }).eq('id', integration_id);

    const config = integration.config_json;
    const provider = integration.provider.toLowerCase();
    
    let alerts: any[] = [];
    let fetchError: string | null = null;

    try {
      // Fetch alerts based on provider
      if (provider.includes('splunk')) {
        alerts = await fetchSplunkAlerts(config, fetch_window_minutes, max_alerts);
      } else if (provider.includes('qradar')) {
        alerts = await fetchQRadarAlerts(config, fetch_window_minutes, max_alerts);
      } else if (provider.includes('arcsight')) {
        alerts = await fetchArcSightAlerts(config, fetch_window_minutes, max_alerts);
      } else if (provider.includes('logrhythm')) {
        alerts = await fetchLogRhythmAlerts(config, fetch_window_minutes, max_alerts);
      } else {
        throw new Error(`Unsupported SIEM provider: ${provider}`);
      }
    } catch (err) {
      fetchError = err instanceof Error ? err.message : 'Unknown fetch error';
      console.error(`❌ Failed to fetch from ${provider}:`, fetchError);
      
      await supabase.from('incident_integrations').update({
        sync_status: 'error',
        last_error: fetchError,
      }).eq('id', integration_id);

      return new Response(
        JSON.stringify({ error: fetchError, alerts_fetched: 0 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each alert and create incidents
    const results = {
      total_fetched: alerts.length,
      incidents_created: 0,
      incidents_skipped: 0,
      errors: [] as string[],
    };

    for (const alert of alerts) {
      try {
        // Check if incident already exists for this alert
        const alertId = alert.id || alert.alert_id || alert.offense_id;
        const { data: existing } = await supabase
          .from('security_incidents')
          .select('id')
          .eq('tenant_id', integration.tenant_id)
          .eq('source_system', provider)
          .eq('external_reference', alertId)
          .single();

        if (existing) {
          results.incidents_skipped++;
          continue;
        }

        // Forward to webhook receiver for standardized processing
        const { data: webhookData } = await supabase.functions.invoke('incident-webhook-receiver', {
          body: {
            integration_id: integration.id,
            source: provider,
            alert_data: alert,
          },
        });

        if (webhookData?.success) {
          results.incidents_created++;
        } else {
          results.errors.push(`Failed to create incident for alert ${alertId}`);
        }
      } catch (err) {
        results.errors.push(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    // Update integration statistics
    await supabase.from('incident_integrations').update({
      sync_status: 'idle',
      total_events_received: (integration.total_events_received || 0) + results.total_fetched,
      last_event_at: new Date().toISOString(),
      last_error: results.errors.length > 0 ? results.errors[0] : null,
    }).eq('id', integration_id);

    console.log(`✅ SIEM sync completed: ${results.incidents_created} incidents created`);

    return new Response(
      JSON.stringify(results),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ SIEM connector error:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Fetch alerts from Splunk
 */
async function fetchSplunkAlerts(config: any, windowMinutes: number, maxAlerts: number): Promise<any[]> {
  const { base_url, api_token, search_query } = config;
  
  if (!base_url || !api_token) {
    throw new Error('Splunk configuration incomplete: base_url and api_token required');
  }

  const earliestTime = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  
  const searchUrl = `${base_url}/services/search/jobs/export`;
  const query = search_query || 'search index=security severity>=3';
  
  const response = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${api_token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      search: `${query} earliest_time="${earliestTime}"`,
      output_mode: 'json',
      count: String(maxAlerts),
    }),
  });

  if (!response.ok) {
    throw new Error(`Splunk API error: ${response.status} ${response.statusText}`);
  }

  const results = await response.json();
  return Array.isArray(results) ? results : results.results || [];
}

/**
 * Fetch offenses from QRadar
 */
async function fetchQRadarAlerts(config: any, windowMinutes: number, maxAlerts: number): Promise<any[]> {
  const { base_url, api_token } = config;
  
  if (!base_url || !api_token) {
    throw new Error('QRadar configuration incomplete: base_url and api_token required');
  }

  const startTime = Date.now() - windowMinutes * 60 * 1000;
  
  const offensesUrl = `${base_url}/api/siem/offenses?filter=start_time>${startTime}&sort=-start_time&limit=${maxAlerts}`;
  
  const response = await fetch(offensesUrl, {
    headers: {
      'SEC': api_token,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`QRadar API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch alerts from ArcSight
 */
async function fetchArcSightAlerts(config: any, windowMinutes: number, maxAlerts: number): Promise<any[]> {
  const { base_url, username, password } = config;
  
  if (!base_url || !username || !password) {
    throw new Error('ArcSight configuration incomplete: base_url, username, and password required');
  }

  // ArcSight ESM REST API
  const loginUrl = `${base_url}/www/core-service/rest/LoginService/login`;
  
  // Login to get auth token
  const loginResponse = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      login: username,
      password: password,
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`ArcSight login failed: ${loginResponse.status}`);
  }

  const { authToken } = await loginResponse.json();
  
  // Query active cases (incidents)
  const casesUrl = `${base_url}/www/manager-service/rest/CaseService/findAllIds`;
  
  const casesResponse = await fetch(casesUrl, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!casesResponse.ok) {
    throw new Error(`ArcSight cases query failed: ${casesResponse.status}`);
  }

  const caseIds = await casesResponse.json();
  
  // Fetch case details (limited to maxAlerts)
  const cases = [];
  for (const caseId of caseIds.slice(0, maxAlerts)) {
    const caseUrl = `${base_url}/www/manager-service/rest/CaseService/getResourceById/${caseId}`;
    const caseResponse = await fetch(caseUrl, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    
    if (caseResponse.ok) {
      cases.push(await caseResponse.json());
    }
  }

  return cases;
}

/**
 * Fetch alarms from LogRhythm
 */
async function fetchLogRhythmAlerts(config: any, windowMinutes: number, maxAlerts: number): Promise<any[]> {
  const { base_url, api_token } = config;
  
  if (!base_url || !api_token) {
    throw new Error('LogRhythm configuration incomplete: base_url and api_token required');
  }

  const startTime = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  
  const alarmsUrl = `${base_url}/lr-alarm-api/alarms`;
  
  const response = await fetch(alarmsUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${api_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      alarmFilterParameters: {
        dateInserted: { startDate: startTime },
        maxResults: maxAlerts,
        orderBy: 'dateInserted',
        direction: 'Descending',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`LogRhythm API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
