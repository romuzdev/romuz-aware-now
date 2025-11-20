// D1 – Gate-N Health Check Edge Function
// Runs diagnostic checks for Gate-N components (RPCs, RBAC, Edge Functions)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Types
// ============================================================================

type HealthCheckStatus = 'pass' | 'warn' | 'fail';
type HealthCheckSeverity = 'low' | 'medium' | 'high';

interface HealthCheckItem {
  code: string;
  label: string;
  status: HealthCheckStatus;
  severity: HealthCheckSeverity;
  latencyMs: number;
  message?: string;
  errorCode?: string;
  details?: any;
}

interface HealthCheckResult {
  success: boolean;
  startedAt: string;
  finishedAt: string;
  checks: HealthCheckItem[];
}

// ============================================================================
// Helper: Run a single check
// ============================================================================

async function runCheck(
  code: string,
  label: string,
  severity: HealthCheckSeverity,
  checkFn: () => Promise<{ status: HealthCheckStatus; message?: string; errorCode?: string; details?: any }>
): Promise<HealthCheckItem> {
  const start = performance.now();
  try {
    const result = await checkFn();
    const latencyMs = Math.round(performance.now() - start);
    return {
      code,
      label,
      severity,
      latencyMs,
      ...result,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      code,
      label,
      severity,
      latencyMs,
      status: 'fail',
      message: err.message || 'Unexpected error',
      errorCode: 'EXCEPTION',
    };
  }
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();
  const checks: HealthCheckItem[] = [];

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unauthorized: Missing Authorization header',
          checks: [],
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Authenticate user
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unauthorized: Invalid token',
          checks: [],
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = user.id;

    // Get tenant_id
    const { data: tenantData, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', userId)
      .single();

    if (tenantError || !tenantData) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Tenant not found for user',
          checks: [],
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const tenantId = tenantData.tenant_id;

    // Check RBAC: user must have tenant_admin or system_admin role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to verify user roles',
          checks: [],
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userRoles = (roles || []).map((r: any) => r.role);
    const isAdmin = userRoles.includes('admin');

    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Forbidden: admin role required',
          checks: [],
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[gate-n-health-check] Running health checks for tenant: ${tenantId}, user: ${userId}`);

    // ========================================================================
    // Check 1: rbac_current_user
    // ========================================================================
    checks.push(
      await runCheck('rbac_current_user', 'Current user RBAC', 'high', async () => {
        if (isAdmin) {
          return {
            status: 'pass',
            message: 'User has admin role',
            details: { roles: userRoles },
          };
        } else {
          return {
            status: 'fail',
            message: 'User does not have admin role',
            errorCode: 'RBAC_DENIED',
            details: { roles: userRoles },
          };
        }
      })
    );

    // ========================================================================
    // Check 2: rpc_status_snapshot
    // ========================================================================
    checks.push(
      await runCheck('rpc_status_snapshot', 'Status snapshot RPC', 'high', async () => {
        const { data, error } = await supabase.rpc('fn_gate_n_get_status_snapshot');

        if (error) {
          return {
            status: 'fail',
            message: `RPC failed: ${error.message}`,
            errorCode: 'RPC_ERROR',
          };
        }

        if (!data || typeof data !== 'object') {
          return {
            status: 'fail',
            message: 'RPC returned invalid data',
            errorCode: 'INVALID_DATA',
          };
        }

        return {
          status: 'pass',
          message: 'Status snapshot retrieved successfully',
          details: {
            jobs_total: data.jobs?.total || 0,
            jobs_enabled: data.jobs?.enabled || 0,
          },
        };
      })
    );

    // ========================================================================
    // Check 3: rpc_admin_settings
    // ========================================================================
    checks.push(
      await runCheck('rpc_admin_settings', 'Admin settings RPC', 'medium', async () => {
        const { data, error } = await supabase.rpc('fn_gate_n_get_admin_settings');

        if (error) {
          return {
            status: 'fail',
            message: `RPC failed: ${error.message}`,
            errorCode: 'RPC_ERROR',
          };
        }

        if (!data || data.length === 0) {
          return {
            status: 'warn',
            message: 'No admin_settings row for tenant',
            errorCode: 'NO_SETTINGS',
          };
        }

        return {
          status: 'pass',
          message: 'Admin settings retrieved successfully',
          details: {
            settings_count: data.length,
          },
        };
      })
    );

    // ========================================================================
    // Check 4: rpc_list_jobs
    // ========================================================================
    checks.push(
      await runCheck('rpc_list_jobs', 'List system jobs RPC', 'medium', async () => {
        const { data, error } = await supabase.rpc('fn_gate_n_list_system_jobs', {
          p_tenant_id: tenantId,
        });

        if (error) {
          return {
            status: 'fail',
            message: `RPC failed: ${error.message}`,
            errorCode: 'RPC_ERROR',
          };
        }

        const jobCount = data?.length || 0;

        if (jobCount === 0) {
          return {
            status: 'warn',
            message: 'No jobs found for tenant',
            errorCode: 'NO_JOBS_FOUND',
            details: { job_count: 0 },
          };
        }

        return {
          status: 'pass',
          message: `Found ${jobCount} job(s)`,
          details: {
            job_count: jobCount,
            enabled_jobs: data.filter((j: any) => j.is_enabled).length,
          },
        };
      })
    );

    // ========================================================================
    // Check 5: db_connectivity (simple query)
    // ========================================================================
    checks.push(
      await runCheck('db_connectivity', 'Database connectivity', 'high', async () => {
        const { data, error } = await supabase.from('user_tenants').select('tenant_id').limit(1);

        if (error) {
          return {
            status: 'fail',
            message: `DB query failed: ${error.message}`,
            errorCode: 'DB_ERROR',
          };
        }

        return {
          status: 'pass',
          message: 'Database is reachable',
        };
      })
    );

    // ========================================================================
    // Aggregate result
    // ========================================================================
    const finishedAt = new Date().toISOString();

    // success = true if no "high" severity checks failed
    const highSeverityFailures = checks.filter(
      (c) => c.severity === 'high' && c.status === 'fail'
    );
    const success = highSeverityFailures.length === 0;

    const result: HealthCheckResult = {
      success,
      startedAt,
      finishedAt,
      checks,
    };

    // ========================================================================
    // Audit log
    // ========================================================================
    try {
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        user_id: userId,
        action_type: 'HEALTH_CHECK',
        gate_code: 'Gate-N',
        timestamp: new Date().toISOString(),
        metadata: {
          success,
          checks_count: checks.length,
          high_severity_failures: highSeverityFailures.length,
        },
      });
    } catch (auditErr) {
      console.error('[gate-n-health-check] Failed to log audit entry:', auditErr);
    }

    console.log(`[gate-n-health-check] Completed. Success: ${success}, Checks: ${checks.length}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[gate-n-health-check] Unexpected error:', err);

    const finishedAt = new Date().toISOString();
    return new Response(
      JSON.stringify({
        success: false,
        startedAt,
        finishedAt,
        checks,
        message: err.message || 'Unexpected error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
