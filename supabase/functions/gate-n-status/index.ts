import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusResponse {
  success: boolean;
  data?: any;
  message?: string;
  error_code?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[gate-n-status] Request received', { method: req.method, url: req.url });

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[gate-n-status] Missing authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing authorization header', 
          error_code: 'AUTH_REQUIRED' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get current user from JWT (pass the token explicitly to avoid "Auth session missing" on Edge)
    const bearer = authHeader?.trim() || '';
    const tokenMatch = bearer.match(/^Bearer\s+(.+)$/i);
    const jwt = tokenMatch ? tokenMatch[1] : bearer;

    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('[gate-n-status] Invalid or expired token', { error: userError?.message, name: userError?.name, status: (userError as any)?.status });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid or expired token', 
          error_code: 'AUTH_INVALID' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[gate-n-status] User authenticated', { userId: user.id });

    // Get user's tenant_id
    const { data: tenantData, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (tenantError || !tenantData) {
      console.error('[gate-n-status] User not associated with tenant', { 
        userId: user.id, 
        error: tenantError 
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User not associated with any tenant', 
          error_code: 'TENANT_REQUIRED' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantId = tenantData.tenant_id;
    console.log('[gate-n-status] Tenant identified', { tenantId });

    // Check user role (must be tenant_admin)
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('[gate-n-status] Failed to fetch user roles', { 
        userId: user.id, 
        error: rolesError 
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to verify user permissions', 
          error_code: 'ROLES_CHECK_FAILED' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRoles = rolesData?.map(r => r.role) || [];
    const hasAdminRole = userRoles.includes('admin');

    if (!hasAdminRole) {
      console.warn('[gate-n-status] Access denied - insufficient permissions', { 
        userId: user.id, 
        roles: userRoles,
        required: 'admin' 
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Access denied. Admin role required to view system status.', 
          error_code: 'PERMISSION_DENIED' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[gate-n-status] Permission granted', { roles: userRoles });

    // Call RPC function to get status snapshot
    const { data: statusData, error: rpcError } = await supabase
      .rpc('fn_gate_n_get_status_snapshot');

    if (rpcError) {
      console.error('[gate-n-status] RPC call failed', { 
        error: rpcError,
        code: rpcError.code,
        details: rpcError.details,
        hint: rpcError.hint
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Failed to retrieve status: ${rpcError.message}`, 
          error_code: 'RPC_FAILED' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[gate-n-status] Status snapshot retrieved successfully', {
      dataKeys: statusData ? Object.keys(statusData) : null
    });

    // Log audit event
    try {
      const { error: auditError } = await supabase
        .from('audit_log')
        .insert({
          tenant_id: tenantId,
          entity_type: 'system_status',
          entity_id: tenantId, // Use tenant_id as entity_id for system-level actions
          action: 'system_status.viewed',
          actor: user.id,
          payload: {
            gate_code: 'Gate-N',
            action_type: 'VIEW_STATUS',
            snapshot_at: new Date().toISOString()
          }
        });

      if (auditError) {
        console.warn('[gate-n-status] Failed to log audit event (non-blocking)', { 
          error: auditError 
        });
        // Don't fail the request if audit logging fails
      } else {
        console.log('[gate-n-status] Audit event logged successfully');
      }
    } catch (auditException) {
      console.warn('[gate-n-status] Audit logging exception (non-blocking)', { 
        exception: auditException 
      });
    }

    // Return successful response
    const duration = Date.now() - startTime;
    console.log('[gate-n-status] Request completed successfully', { 
      duration: `${duration}ms` 
    });

    const response: StatusResponse = {
      success: true,
      data: statusData
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[gate-n-status] Unexpected error', { 
      error: errorMessage,
      stack: errorStack,
      duration: `${duration}ms`
    });

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error', 
        error_code: 'INTERNAL_ERROR' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
