// Gate-N Edge Function: gate-n-jobs
// Purpose: List all available system jobs for the current tenant

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusResponse {
  success: boolean;
  jobs?: any[];
  message?: string;
  error_code?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Call RPC function to list jobs with tenant_id parameter
    const { data: jobs, error: rpcError } = await supabase
      .rpc('fn_gate_n_list_system_jobs', { p_tenant_id: tenantId });

    if (rpcError) {
      console.error('RPC fn_gate_n_list_system_jobs failed:', rpcError);
      return new Response(
        JSON.stringify({ success: false, message: `Failed to list jobs: ${rpcError.message}`, error_code: 'RPC_FAILED' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully retrieved jobs:', jobs?.length || 0);

    // Audit log: LIST_JOBS
    try {
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        entity_type: 'system_jobs',
        entity_id: 'all',
        action: 'system_jobs.listed',
        actor: user.id,
        payload: {
          action_type: 'LIST_JOBS',
          gate_code: 'Gate-N',
          jobs_count: jobs?.length || 0,
        },
      });
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError);
      // Don't fail the request if audit logging fails
    }

    // Return success response
    const response: StatusResponse = {
      success: true,
      jobs: jobs || [],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in gate-n-jobs:', error);
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
