import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobResult {
  job_key: string;
  status: 'success' | 'error';
  duration_ms: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: JobResult[] = [];

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    console.log('🚀 Starting periodic jobs execution...');

    // Job 1: Health Checks
    const healthStart = Date.now();
    try {
      const { error: healthError } = await supabase.rpc('fn_job_check_tenant_health');
      const healthDuration = Date.now() - healthStart;
      
      if (healthError) throw healthError;
      
      results.push({
        job_key: 'health_checks',
        status: 'success',
        duration_ms: healthDuration,
      });
      console.log(`✅ Health checks completed in ${healthDuration}ms`);
    } catch (error) {
      const healthDuration = Date.now() - healthStart;
      results.push({
        job_key: 'health_checks',
        status: 'error',
        duration_ms: healthDuration,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error('❌ Health checks failed:', error);
    }

    // Job 2: Drift Detection
    const driftStart = Date.now();
    try {
      const { error: driftError } = await supabase.rpc('fn_job_detect_drift');
      const driftDuration = Date.now() - driftStart;
      
      if (driftError) throw driftError;
      
      results.push({
        job_key: 'drift_detection',
        status: 'success',
        duration_ms: driftDuration,
      });
      console.log(`✅ Drift detection completed in ${driftDuration}ms`);
    } catch (error) {
      const driftDuration = Date.now() - driftStart;
      results.push({
        job_key: 'drift_detection',
        status: 'error',
        duration_ms: driftDuration,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error('❌ Drift detection failed:', error);
    }

    // Job 3: Deprovision Processing
    const deprovisionStart = Date.now();
    try {
      const { error: deprovisionError } = await supabase.rpc('fn_job_process_deprovision');
      const deprovisionDuration = Date.now() - deprovisionStart;
      
      if (deprovisionError) throw deprovisionError;
      
      results.push({
        job_key: 'deprovision_processing',
        status: 'success',
        duration_ms: deprovisionDuration,
      });
      console.log(`✅ Deprovision processing completed in ${deprovisionDuration}ms`);
    } catch (error) {
      const deprovisionDuration = Date.now() - deprovisionStart;
      results.push({
        job_key: 'deprovision_processing',
        status: 'error',
        duration_ms: deprovisionDuration,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error('❌ Deprovision processing failed:', error);
    }

    // Calculate total execution time
    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    // Log to audit_log
    await supabase.from('audit_log').insert({
      action: 'PERIODIC_JOBS_EXECUTED',
      actor: 'system',
      entity_type: 'system_jobs',
      details: {
        results,
        success_count: successCount,
        error_count: errorCount,
        total_duration_ms: totalDuration,
      },
    });

    console.log(`🏁 Periodic jobs completed: ${successCount} success, ${errorCount} errors, ${totalDuration}ms total`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          success_count: successCount,
          error_count: errorCount,
          total_duration_ms: totalDuration,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in periodic jobs:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
