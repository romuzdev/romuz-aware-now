// Gate-N Edge Function: gate-n-job-delete
// Purpose: Delete a system job

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: job_id', error_code: 'INVALID_INPUT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get job info before deletion for audit
    const { data: jobInfo } = await supabase
      .from('system_jobs')
      .select('job_key, gate_code')
      .eq('id', job_id)
      .eq('tenant_id', tenantId)
      .single();

    // Delete job (only tenant-owned jobs can be deleted)
    const { error: deleteError } = await supabase
      .from('system_jobs')
      .delete()
      .eq('id', job_id)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Failed to delete job:', deleteError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Failed to delete job: ${deleteError.message}`, 
          error_code: 'DELETE_FAILED' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Audit log
    try {
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        entity_type: 'system_jobs',
        entity_id: job_id,
        action: 'system_jobs.deleted',
        actor: user.id,
        payload: jobInfo || { job_id },
      });
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Job deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in gate-n-job-delete:', error);
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
