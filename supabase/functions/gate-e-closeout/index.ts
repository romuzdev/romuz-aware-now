// ============================================================================
// Gate-E Closeout: Smoke Tests & Seed Data Generator (Enhanced)
// ============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmokeTestResult {
  success: boolean;
  flag?: any;
  channel?: any;
  seed?: any;
  policy?: any;
  tests?: any;
  errors?: string[];
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const errors: string[] = [];
  const result: SmokeTestResult = { success: false, errors };

  try {
    console.log('='.repeat(80));
    console.log('Gate-E Closeout: Starting Comprehensive Smoke Tests');
    console.log('='.repeat(80));

    // ========================================================================
    // Test 1: Feature Flag Verification
    // ========================================================================
    console.log('\n[Test 1/8] Feature Flag Verification...');
    const { data: flags, error: flagError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('flag_key', 'OBSERVABILITY_V2_ENABLED')
      .eq('is_enabled', true);

    if (flagError) {
      errors.push(`Flag check failed: ${flagError.message}`);
      console.error('❌ FAILED:', flagError.message);
    } else {
      result.flag = {
        enabled_tenants: flags?.length || 0,
        tenants: flags?.map(f => f.tenant_id) || []
      };
      console.log(`✅ PASSED: ${flags?.length || 0} tenants have flag enabled`);
    }

    // ========================================================================
    // Test 2: Platform Channel Verification
    // ========================================================================
    console.log('\n[Test 2/8] Platform Channel Verification...');
    const { data: channel, error: channelError } = await supabase
      .from('alert_channels')
      .select('*')
      .is('tenant_id', null)
      .eq('type', 'email')
      .eq('is_active', true)
      .single();

    if (channelError) {
      errors.push(`Channel check failed: ${channelError.message}`);
      console.error('❌ FAILED:', channelError.message);
    } else if (!channel.config_json?.to?.includes('RomuzDev@gmail.com')) {
      errors.push('Platform channel email mismatch');
      console.error('❌ FAILED: Email does not match RomuzDev@gmail.com');
    } else {
      result.channel = {
        id: channel.id,
        type: channel.type,
        config: channel.config_json
      };
      console.log(`✅ PASSED: Platform channel ${channel.id} configured correctly`);
    }

    // ========================================================================
    // Test 3: Seed Data Verification
    // ========================================================================
    console.log('\n[Test 3/8] Seed Data Verification...');
    const { data: campaigns, error: campError } = await supabase
      .from('awareness_campaigns')
      .select('id, name, is_test')
      .eq('is_test', true)
      .in('name', ['Campaign A - Awareness Test', 'Campaign B - Security Training']);

    if (campError) {
      errors.push(`Seed campaigns check failed: ${campError.message}`);
      console.error('❌ FAILED:', campError.message);
    } else if (campaigns?.length !== 2) {
      errors.push(`Expected 2 demo campaigns, found ${campaigns?.length || 0}`);
      console.error(`❌ FAILED: Expected 2 campaigns, found ${campaigns?.length || 0}`);
    } else {
      // Verify participants
      const { data: participants } = await supabase
        .from('campaign_participants')
        .select('id, campaign_id, status')
        .in('campaign_id', campaigns.map(c => c.id));

      result.seed = {
        campaigns_created: campaigns.length,
        total_participants: participants?.length || 0,
        completed: participants?.filter(p => p.status === 'completed').length || 0,
        in_progress: participants?.filter(p => p.status === 'in_progress').length || 0
      };
      console.log(`✅ PASSED: 2 campaigns with ${participants?.length || 0} participants`);
    }

    // ========================================================================
    // Test 4: Alert Policy Verification
    // ========================================================================
    console.log('\n[Test 4/8] Alert Policy Verification...');
    const { data: policies, error: policyError } = await supabase
      .from('alert_policies')
      .select('*')
      .eq('name', 'export_failure')
      .eq('is_enabled', true);

    if (policyError) {
      errors.push(`Policy check failed: ${policyError.message}`);
      console.error('❌ FAILED:', policyError.message);
    } else {
      // Verify metric is correct
      const wrongMetric = policies?.find(p => p.metric !== 'export_failure_events');
      if (wrongMetric) {
        errors.push(`Policy metric mismatch: expected export_failure_events, got ${wrongMetric.metric}`);
        console.error(`❌ FAILED: Wrong metric ${wrongMetric.metric}`);
      } else {
        result.policy = {
          count: policies?.length || 0,
          enabled: policies?.filter(p => p.is_enabled).length || 0,
          metric: 'export_failure_events'
        };
        console.log(`✅ PASSED: ${policies?.length || 0} policies with correct metric`);
      }
    }

    // ========================================================================
    // Test 5: Materialized View Check (Last 7 Riyadh Days)
    // ========================================================================
    console.log('\n[Test 5/8] Materialized View KPI Check...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: kpiData, error: kpiError } = await supabase
      .from('mv_campaign_kpis_daily')
      .select('*')
      .gte('date_r', sevenDaysAgoStr)
      .limit(50);

    if (kpiError) {
      errors.push(`KPI view check failed: ${kpiError.message}`);
      console.error('❌ FAILED:', kpiError.message);
    } else {
      if (!result.tests) result.tests = {};
      result.tests.mv_kpis_last_7_days = kpiData?.length || 0;
      console.log(`✅ PASSED: ${kpiData?.length || 0} KPI records in last 7 days`);
    }

    // ========================================================================
    // Test 6: Failed Export Job Simulation
    // ========================================================================
    console.log('\n[Test 6/8] Failed Export Job Simulation...');
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (tenants && tenants.length > 0) {
      const tenantId = tenants[0].id;
      
      const { data: jobRun, error: jobError } = await supabase
        .from('job_runs')
        .insert({
          tenant_id: tenantId,
          job_type: 'csv_export',
          status: 'failed',
          error_message: 'Simulated failure for Gate-E smoke test',
          completed_at: new Date().toISOString(),
          metadata: { test: true, reason: 'gate_e_closeout', timestamp: Date.now() }
        })
        .select()
        .single();

      if (jobError) {
        errors.push(`Job simulation failed: ${jobError.message}`);
        console.error('❌ FAILED:', jobError.message);
      } else {
        if (!result.tests) result.tests = {};
        result.tests.job_run_id = jobRun.id;
        console.log(`✅ PASSED: Failed job created ${jobRun.id}`);
      }
    } else {
      errors.push('No active tenants for job simulation');
      console.error('❌ FAILED: No active tenants');
    }

    // ========================================================================
    // Test 7: Audit Entries Verification
    // ========================================================================
    console.log('\n[Test 7/8] Audit Entries Verification...');
    const { data: auditEntries, error: auditError } = await supabase
      .from('audit_log')
      .select('action')
      .in('action', ['flag_set', 'channel_upsert', 'seed_generate', 'policy_upsert']);

    if (auditError) {
      errors.push(`Audit log check failed: ${auditError.message}`);
      console.error('❌ FAILED:', auditError.message);
    } else {
      const actions = auditEntries?.map(e => e.action) || [];
      const missingActions = ['flag_set', 'channel_upsert', 'seed_generate', 'policy_upsert']
        .filter(a => !actions.includes(a));
      
      if (missingActions.length > 0) {
        errors.push(`Missing audit entries: ${missingActions.join(', ')}`);
        console.error(`❌ FAILED: Missing ${missingActions.join(', ')}`);
      } else {
        if (!result.tests) result.tests = {};
        result.tests.audit_entries_complete = true;
        result.tests.audit_count = auditEntries?.length || 0;
        console.log(`✅ PASSED: All 4 required audit entries found (${auditEntries?.length} total)`);
      }
    }

    // ========================================================================
    // Test 8: Policy-Channel Link Verification
    // ========================================================================
    console.log('\n[Test 8/8] Policy-Channel Link Verification...');
    const { data: policyChannels, error: linkError } = await supabase
      .from('alert_policy_channels')
      .select('policy_id, channel_id')
      .limit(10);

    if (linkError) {
      errors.push(`Policy-Channel link check failed: ${linkError.message}`);
      console.error('❌ FAILED:', linkError.message);
    } else if (!policyChannels || policyChannels.length === 0) {
      errors.push('No policy-channel links found');
      console.error('❌ FAILED: No links found');
    } else {
      if (!result.tests) result.tests = {};
      result.tests.policy_channel_links = policyChannels.length;
      console.log(`✅ PASSED: ${policyChannels.length} policy-channel links active`);
    }

    // ========================================================================
    // Final Result
    // ========================================================================
    result.success = errors.length === 0;

    console.log('\n' + '='.repeat(80));
    if (result.success) {
      console.log('Gate-E Closeout: SUCCESS ✅');
      console.log('All 8 smoke tests passed!');
    } else {
      console.log('Gate-E Closeout: FAILED ❌');
      console.log(`${errors.length} test(s) failed:`);
      errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
    }
    console.log('='.repeat(80));

    if (result.success) {
      return new Response(
        JSON.stringify({
          status: 'SUCCESS',
          message: 'Gate-E Closeout: SUCCESS ✅',
          summary: {
            tests_passed: 8,
            tests_failed: 0
          },
          details: result
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          status: 'FAILED',
          message: 'Gate-E Closeout: FAILED ❌',
          summary: {
            tests_passed: 8 - errors.length,
            tests_failed: errors.length
          },
          errors,
          partial_results: result
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error: any) {
    console.error('Gate-E Closeout Critical Error:', error);
    return new Response(
      JSON.stringify({
        status: 'FAILED',
        message: 'Gate-E Closeout: FAILED ❌',
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

