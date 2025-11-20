// ============================================================================
// Gate-E: Job 3 - Alert Dispatcher
// ============================================================================
// Purpose: Send pending alerts via configured channels (email/webhook/slack)
// Trigger: Every 5 minutes
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
    const dispatched: string[] = [];

    console.log("[dispatch-alerts] Starting alert dispatch...");

    // Fetch pending alerts
    const { data: events, error: eventsError } = await supabase
      .from('alert_events')
      .select('*, alert_policies!inner(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    if (eventsError) throw eventsError;

    console.log(`[dispatch-alerts] Found ${events?.length || 0} pending alerts`);

    for (const event of events || []) {
      try {
        const policy = event.alert_policies;

        // Check cooldown
        if (policy.last_triggered_at) {
          const lastTriggered = new Date(policy.last_triggered_at);
          const cooldownEnd = new Date(lastTriggered.getTime() + policy.notify_cooldown_minutes * 60000);
          
          if (new Date() < cooldownEnd) {
            console.log(`[dispatch-alerts] ⏳ Policy ${policy.id} in cooldown, skipping...`);
            continue;
          }
        }

        // Fetch channels for this policy
        let { data: policyChannels, error: channelsError } = await supabase
          .from('alert_policy_channels')
          .select('*, alert_channels!inner(*)')
          .eq('policy_id', policy.id);

        if (channelsError || !policyChannels || policyChannels.length === 0) {
          // Use default platform email if no channels configured
          const { data: defaultChannel } = await supabase
            .from('alert_channels')
            .select('*')
            .is('tenant_id', null)
            .eq('type', 'email')
            .eq('is_active', true)
            .maybeSingle();

          if (defaultChannel) {
            policyChannels = [{
              alert_channels: defaultChannel,
              subject_prefix: null,
            }];
          }
        }

        // Fetch template
        const { data: template } = await supabase
          .from('alert_templates')
          .select('*')
          .or(`tenant_id.eq.${policy.tenant_id},tenant_id.is.null`)
          .eq('code', policy.template_code || 'kpi_alert')
          .eq('locale', 'ar')
          .maybeSingle();

        // Dispatch to each channel
        for (const pc of policyChannels || []) {
          const channel = pc.alert_channels;
          
          if (channel.type === 'email') {
            // Email dispatch (simplified - requires Resend or email service)
            const emailTo = channel.config_json.to || 'RomuzDev@gmail.com';
            
            // Render template
            let subject = template?.subject_tpl || '[{{severity}}] Alert';
            let body = template?.body_tpl || 'Alert detected';
            
            // Simple variable replacement
            subject = subject
              .replace('{{severity}}', policy.severity.toUpperCase())
              .replace('{{metric}}', policy.metric);
            
            body = body
              .replace('{{metric}}', policy.metric)
              .replace('{{value}}', event.metric_value.toFixed(2))
              .replace('{{baseline}}', (event.baseline_value || 0).toFixed(2))
              .replace('{{severity}}', policy.severity)
              .replace('{{time_window}}', policy.time_window);

            console.log(`[dispatch-alerts] 📧 Would send email to ${emailTo}: ${subject}`);
            
            // TODO: Integrate with Resend or email service
            // For now, just log
          }
        }

        // Mark as dispatched
        await supabase
          .from('alert_events')
          .update({
            status: 'dispatched',
            dispatched_at: new Date().toISOString(),
          })
          .eq('id', event.id);

        // Update policy last_triggered_at
        await supabase
          .from('alert_policies')
          .update({ last_triggered_at: new Date().toISOString() })
          .eq('id', policy.id);

        dispatched.push(event.id);
        
      } catch (eventError) {
        console.error(`[dispatch-alerts] Error processing event ${event.id}:`, eventError);
        
        // Mark as failed
        await supabase
          .from('alert_events')
          .update({
            status: 'failed',
            error_message: eventError instanceof Error ? eventError.message : 'Unknown error',
          })
          .eq('id', event.id);
      }
    }

    const duration = Date.now() - startTime;
    
    console.log(`[dispatch-alerts] ✅ Completed in ${duration}ms, dispatched ${dispatched.length} alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        duration_ms: duration,
        events_processed: events?.length || 0,
        dispatched_count: dispatched.length,
        dispatched_ids: dispatched,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[dispatch-alerts] Error:", error);
    
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
