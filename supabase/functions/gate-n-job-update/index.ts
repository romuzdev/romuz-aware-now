// Gate-N Edge Function: gate-n-job-update
// Purpose: Update an existing system job

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateJobRequest {
  job_id: string;
  display_name?: string;
  description?: string;
  job_type?: string;
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
    const body: UpdateJobRequest = await req.json();

    if (!body.job_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: job_id', error_code: 'INVALID_INPUT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build update object
    const updates: any = {};
    if (body.display_name !== undefined) updates.display_name = body.display_name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.job_type !== undefined) updates.job_type = body.job_type;
    if (body.schedule_cron !== undefined) updates.schedule_cron = body.schedule_cron;
    if (body.is_enabled !== undefined) updates.is_enabled = body.is_enabled;
    if (body.config !== undefined) updates.config = body.config;

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No fields to update', error_code: 'INVALID_INPUT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update job (only tenant-owned jobs can be updated)
    const { data: updatedJob, error: updateError } = await supabase
      .from('system_jobs')
      .update(updates)
      .eq('id', body.job_id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update job:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Failed to update job: ${updateError.message}`, 
          error_code: 'UPDATE_FAILED' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!updatedJob) {
      return new Response(
        JSON.stringify({ success: false, message: 'Job not found or not owned by tenant', error_code: 'NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Audit log
    try {
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        entity_type: 'system_jobs',
        entity_id: body.job_id,
        action: 'system_jobs.updated',
        actor: user.id,
        payload: updates,
      });
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError);
    }

    return new Response(
      JSON.stringify({ success: true, data: updatedJob }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in gate-n-job-update:', error);
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
