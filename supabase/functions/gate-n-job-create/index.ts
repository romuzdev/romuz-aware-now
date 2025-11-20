// Gate-N Edge Function: gate-n-job-create
// Purpose: Create a new system job

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateJobRequest {
  job_key: string;
  display_name: string;
  description?: string;
  gate_code: string;
  job_type: string;
  schedule_cron?: string;
  is_enabled?: boolean;
  config?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing Authorization header', error_code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Authentication failed', error_code: 'AUTH_FAILED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tenant_id
    const { data: tenantData, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (tenantError || !tenantData?.tenant_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Tenant not found', error_code: 'TENANT_NOT_FOUND' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantId = tenantData.tenant_id;

    // Check role (admin only)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ success: false, message: 'Permission denied: requires admin role', error_code: 'PERMISSION_DENIED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateJobRequest = await req.json();

    // Validate required fields
    if (!body.job_key || !body.display_name || !body.gate_code || !body.job_type) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required fields: job_key, display_name, gate_code, job_type', 
          error_code: 'INVALID_INPUT' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new job
    const { data: newJob, error: insertError } = await supabase
      .from('system_jobs')
      .insert({
        tenant_id: tenantId,
        job_key: body.job_key,
        display_name: body.display_name,
        description: body.description || null,
        gate_code: body.gate_code,
        job_type: body.job_type,
        schedule_cron: body.schedule_cron || null,
        is_enabled: body.is_enabled !== undefined ? body.is_enabled : true,
        config: body.config || {},
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create job:', insertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Failed to create job: ${insertError.message}`, 
          error_code: 'INSERT_FAILED' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Audit log
    try {
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        entity_type: 'system_jobs',
        entity_id: newJob.id,
        action: 'system_jobs.created',
        actor: user.id,
        payload: {
          job_key: body.job_key,
          gate_code: body.gate_code,
        },
      });
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError);
    }

    return new Response(
      JSON.stringify({ success: true, data: newJob }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in gate-n-job-create:', error);
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
