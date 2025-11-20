// ============================================================================
// Gate-E: Job 2 - KPI Drift Detection
// ============================================================================
// Purpose: Detect threshold breaches and create alert events
// Trigger: Hourly
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();
    const alertsCreated: string[] = [];

    console.log("[detect-drift] Starting drift detection...");

    // Fetch all enabled policies
    const { data: policies, error: policiesError } = await supabase
      .from('alert_policies')
      .select('*, alert_policy_targets(*)')
      .eq('is_enabled', true);

    if (policiesError) throw policiesError;

    console.log(`[detect-drift] Found ${policies?.length || 0} active policies`);

    for (const policy of policies || []) {
      try {
        // Fetch current KPIs for policy targets
        const targets = policy.alert_policy_targets || [];
        
        for (const target of targets) {
          const campaignId = target.campaign_id;
          
          // Fetch CTD KPIs
          const { data: kpis, error: kpisError } = await supabase
            .from('vw_campaign_kpis_ctd')
            .select('*')
            .eq('tenant_id', policy.tenant_id)
            .eq('campaign_id', campaignId)
            .maybeSingle();

          if (kpisError || !kpis) continue;

          // Extract metric value based on policy.metric
          const metricKey = `kpi_${policy.metric}`;
          const currentValue = kpis[metricKey] as number || 0;

          // Simple threshold comparison
          let breached = false;
          
          switch (policy.operator) {
            case '<':
              breached = currentValue < policy.threshold_value;
              break;
            case '<=':
              breached = currentValue <= policy.threshold_value;
              break;
            case '>':
              breached = currentValue > policy.threshold_value;
              break;
            case '>=':
              breached = currentValue >= policy.threshold_value;
              break;
            case 'delta_pct':
              // TODO: Implement % change vs baseline (requires lookback)
              console.log(`[detect-drift] delta_pct operator not yet implemented`);
              break;
          }

          if (breached) {
            // Create dedupe key
            const today = new Date().toISOString().split('T')[0];
            const dedupeKey = `${policy.id}_${campaignId}_${policy.severity}_${today}`;

            // Create alert event (with ON CONFLICT handling via dedupe_key unique constraint)
            const { data: event, error: eventError } = await supabase
              .from('alert_events')
              .upsert({
                policy_id: policy.id,
                tenant_id: policy.tenant_id,
                target_ref: campaignId,
                metric_value: currentValue,
                baseline_value: policy.threshold_value,
                delta_pct: null,
                severity: policy.severity,
                dedupe_key: dedupeKey,
                status: 'pending',
              }, {
                onConflict: 'dedupe_key',
                ignoreDuplicates: true,
              })
              .select()
              .maybeSingle();

            if (!eventError && event) {
              alertsCreated.push(event.id);
              console.log(`[detect-drift] ✅ Alert created: ${policy.name} (${policy.metric}=${currentValue})`);
            }
          }
        }
      } catch (policyError) {
        console.error(`[detect-drift] Error processing policy ${policy.id}:`, policyError);
      }
    }

    const duration = Date.now() - startTime;
    
    console.log(`[detect-drift] ✅ Completed in ${duration}ms, created ${alertsCreated.length} alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        duration_ms: duration,
        policies_checked: policies?.length || 0,
        alerts_created: alertsCreated.length,
        alert_ids: alertsCreated,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[detect-drift] Error:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
