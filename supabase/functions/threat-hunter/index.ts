/**
 * Threat Hunter Edge Function
 * M18.5 - SecOps Enhancement
 * 
 * Executes threat hunting queries and returns results
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThreatHuntRequest {
  queryId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Threat Hunter] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { queryId }: ThreatHuntRequest = await req.json();

    if (!queryId) {
      return new Response(
        JSON.stringify({ error: 'Missing queryId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Threat Hunter] Executing query: ${queryId} for user: ${user.id}`);

    const startTime = Date.now();

    // 1. Fetch the query
    const { data: query, error: queryError } = await supabase
      .from('threat_hunt_queries')
      .select('*')
      .eq('id', queryId)
      .single();

    if (queryError || !query) {
      console.error('[Threat Hunter] Query not found:', queryError);
      return new Response(
        JSON.stringify({ error: 'Query not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Execute the hunt based on query type
    let results: any[] = [];
    let matchedEventsCount = 0;
    let matchedIndicatorsCount = 0;

    switch (query.query_type) {
      case 'ioc_search':
        // Search for IOC matches
        const iocValue = query.query_config.ioc_value;
        const iocType = query.query_config.ioc_type;

        if (iocValue) {
          const { data: events } = await supabase
            .from('security_events')
            .select('*')
            .or(`source_ip.eq.${iocValue},target_asset.eq.${iocValue}`)
            .limit(100);

          results = events || [];
          matchedEventsCount = results.length;

          // Check threat indicators
          const { data: indicators } = await supabase
            .from('threat_indicators')
            .select('*')
            .eq('indicator_value', iocValue)
            .limit(10);

          matchedIndicatorsCount = indicators?.length || 0;
        }
        break;

      case 'pattern_match':
        // Pattern matching across events
        const pattern = query.query_config.pattern;
        if (pattern) {
          const { data: patternEvents } = await supabase
            .from('security_events')
            .select('*')
            .ilike('description', `%${pattern}%`)
            .limit(100);

          results = patternEvents || [];
          matchedEventsCount = results.length;
        }
        break;

      case 'anomaly_detection':
        // Find anomalous events
        const { data: anomalyEvents } = await supabase
          .from('security_events')
          .select('*')
          .in('severity', ['critical', 'high'])
          .eq('is_processed', false)
          .order('detected_at', { ascending: false })
          .limit(50);

        results = anomalyEvents || [];
        matchedEventsCount = results.length;
        break;

      case 'correlation':
        // Correlate related events
        const correlationId = query.query_config.correlation_id;
        if (correlationId) {
          const { data: correlatedEvents } = await supabase
            .from('security_events')
            .select('*')
            .eq('correlation_id', correlationId)
            .limit(100);

          results = correlatedEvents || [];
          matchedEventsCount = results.length;
        }
        break;

      default:
        // General search
        const { data: allEvents } = await supabase
          .from('security_events')
          .select('*')
          .order('detected_at', { ascending: false })
          .limit(50);

        results = allEvents || [];
        matchedEventsCount = results.length;
    }

    const executionTime = Date.now() - startTime;

    // 3. Save the result
    const { data: result, error: resultError } = await supabase
      .from('threat_hunt_results')
      .insert({
        query_id: queryId,
        tenant_id: query.tenant_id,
        executed_by: user.id,
        results_data: results,
        matched_events_count: matchedEventsCount,
        matched_indicators_count: matchedIndicatorsCount,
        execution_time_ms: executionTime,
        status: 'completed',
      })
      .select()
      .single();

    if (resultError) {
      console.error('[Threat Hunter] Failed to save result:', resultError);
    }

    // 4. Update query stats
    await supabase
      .from('threat_hunt_queries')
      .update({
        last_executed_at: new Date().toISOString(),
        execution_count: query.execution_count + 1,
        results_count: (query.results_count || 0) + matchedEventsCount,
      })
      .eq('id', queryId);

    console.log(
      `[Threat Hunter] Query executed successfully: ${matchedEventsCount} events, ${matchedIndicatorsCount} indicators in ${executionTime}ms`
    );

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Threat Hunter] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
