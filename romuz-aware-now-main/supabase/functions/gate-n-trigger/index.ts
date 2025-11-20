// Gate-N Edge Function: gate-n-trigger
// Purpose: Trigger a manual job run

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriggerRequest {
  job_key: string;
}

interface TriggerResponse {
  success: boolean;
  run?: any;
  message?: string;
  error_code?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed. Use POST.', error_code: 'METHOD_NOT_ALLOWED' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing Authorization header', error_code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ success: false, message: 'Authentication failed', error_code: 'AUTH_FAILED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    let requestBody: TriggerRequest;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Invalid JSON body:', parseError);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid JSON body', error_code: 'INVALID_JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate job_key
    if (!requestBody.job_key || typeof requestBody.job_key !== 'string') {
      console.error('Missing or invalid job_key');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing or invalid job_key', error_code: 'INVALID_INPUT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jobKey = requestBody.job_key;
    console.log('Triggering job:', jobKey);

    // Get tenant_id
    const { data: tenantData, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (tenantError || !tenantData?.tenant_id) {
      console.error('Failed to get tenant_id:', tenantError);
      return new Response(
        JSON.stringify({ success: false, message: 'Tenant not found', error_code: 'TENANT_NOT_FOUND' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantId = tenantData.tenant_id;
    console.log('Tenant ID:', tenantId);

    // Check role (admin only)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('User does not have required role:', roleError);
      return new Response(
        JSON.stringify({ success: false, message: 'Permission denied: requires admin role', error_code: 'PERMISSION_DENIED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User has role:', roleData.role);

    // Call RPC function to trigger job
    const { data: run, error: rpcError } = await supabase
      .rpc('fn_gate_n_trigger_job', { p_job_key: jobKey });

    if (rpcError) {
      console.error('RPC fn_gate_n_trigger_job failed:', rpcError);
      
      // Check for specific error codes
      if (rpcError.message.includes('JOB_NOT_FOUND')) {
        return new Response(
          JSON.stringify({ success: false, message: `Job not found or disabled: ${jobKey}`, error_code: 'JOB_NOT_FOUND' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, message: `Failed to trigger job: ${rpcError.message}`, error_code: 'RPC_FAILED' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully triggered job run:', run);

    // Audit log: TRIGGER_JOB
    try {
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        entity_type: 'system_job_runs',
        entity_id: run?.[0]?.id || 'unknown',
        action: 'system_job.triggered',
        actor: user.id,
        payload: {
          action_type: 'TRIGGER_JOB',
          gate_code: 'Gate-N',
          job_key: jobKey,
          run_id: run?.[0]?.id,
        },
      });
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError);
      // Don't fail the request if audit logging fails
    }

    // Return success response
    const response: TriggerResponse = {
      success: true,
      run: run?.[0] || run,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in gate-n-trigger:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error',
        error_code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
