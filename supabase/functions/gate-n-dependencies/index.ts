import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DependencyResponse {
  success: boolean;
  data?: any;
  dependencies?: any[];
  tree?: any[];
  message?: string;
  error_code?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unauthorized',
          error_code: 'UNAUTHORIZED',
        } as DependencyResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get tenant_id
    const { data: tenantData, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (tenantError || !tenantData) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'User not associated with any tenant',
          error_code: 'NO_TENANT',
        } as DependencyResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check admin or super_admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const allowedRoles = ['admin', 'super_admin'];
    if (!roleData || !allowedRoles.includes(roleData.role)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Admin or super_admin role required',
          error_code: 'FORBIDDEN',
        } as DependencyResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { action, job_id, parent_job_id, dependent_job_id, dependency_id, ...payload } = await req.json();

    // LIST: Get all dependencies
    if (action === 'list') {
      const filters: any = { tenant_id: tenantData.tenant_id };
      if (job_id) {
        filters['or'] = `parent_job_id.eq.${job_id},dependent_job_id.eq.${job_id}`;
      }

      const { data: dependencies, error: listError } = await supabase
        .from('job_dependencies')
        .select(`
          *,
          parent_job:system_jobs!parent_job_id(id, job_key, job_type),
          dependent_job:system_jobs!dependent_job_id(id, job_key, job_type)
        `)
        .match(job_id ? { tenant_id: tenantData.tenant_id } : filters);

      if (listError) {
        throw new Error(`Failed to list dependencies: ${listError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          dependencies: dependencies || [],
        } as DependencyResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // CREATE: Add new dependency
    if (action === 'create') {
      if (!parent_job_id || !dependent_job_id) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'parent_job_id and dependent_job_id required',
            error_code: 'INVALID_INPUT',
          } as DependencyResponse),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check for circular dependency
      const { data: circularCheck } = await supabase.rpc('fn_detect_circular_dependency', {
        p_parent_job_id: parent_job_id,
        p_dependent_job_id: dependent_job_id,
      });

      if (circularCheck) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Circular dependency detected. This would create an infinite loop.',
            error_code: 'CIRCULAR_DEPENDENCY',
          } as DependencyResponse),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: newDep, error: createError } = await supabase
        .from('job_dependencies')
        .insert({
          tenant_id: tenantData.tenant_id,
          parent_job_id,
          dependent_job_id,
          dependency_type: payload.dependency_type || 'required',
          wait_for_success: payload.wait_for_success !== false,
          retry_on_parent_failure: payload.retry_on_parent_failure || false,
          max_wait_minutes: payload.max_wait_minutes || 60,
          is_active: payload.is_active !== false,
          metadata: payload.metadata || {},
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create dependency: ${createError.message}`);
      }

      // Log audit
      await supabase.from('audit_log').insert({
        tenant_id: tenantData.tenant_id,
        actor_user_id: user.id,
        action: 'dependency_create',
        entity: 'job_dependencies',
        record_id: newDep.id,
        new_values: { parent_job_id, dependent_job_id },
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: newDep,
          message: 'Dependency created successfully',
        } as DependencyResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // UPDATE: Modify existing dependency
    if (action === 'update') {
      if (!dependency_id) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'dependency_id required',
            error_code: 'INVALID_INPUT',
          } as DependencyResponse),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const updateData: any = { updated_by: user.id };
      if (payload.dependency_type) updateData.dependency_type = payload.dependency_type;
      if (payload.wait_for_success !== undefined) updateData.wait_for_success = payload.wait_for_success;
      if (payload.retry_on_parent_failure !== undefined) updateData.retry_on_parent_failure = payload.retry_on_parent_failure;
      if (payload.max_wait_minutes) updateData.max_wait_minutes = payload.max_wait_minutes;
      if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
      if (payload.metadata) updateData.metadata = payload.metadata;

      const { data: updated, error: updateError } = await supabase
        .from('job_dependencies')
        .update(updateData)
        .eq('id', dependency_id)
        .eq('tenant_id', tenantData.tenant_id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update dependency: ${updateError.message}`);
      }

      // Log audit
      await supabase.from('audit_log').insert({
        tenant_id: tenantData.tenant_id,
        actor_user_id: user.id,
        action: 'dependency_update',
        entity: 'job_dependencies',
        record_id: dependency_id,
        new_values: updateData,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: updated,
          message: 'Dependency updated successfully',
        } as DependencyResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // DELETE: Remove dependency
    if (action === 'delete') {
      if (!dependency_id) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'dependency_id required',
            error_code: 'INVALID_INPUT',
          } as DependencyResponse),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error: deleteError } = await supabase
        .from('job_dependencies')
        .delete()
        .eq('id', dependency_id)
        .eq('tenant_id', tenantData.tenant_id);

      if (deleteError) {
        throw new Error(`Failed to delete dependency: ${deleteError.message}`);
      }

      // Log audit
      await supabase.from('audit_log').insert({
        tenant_id: tenantData.tenant_id,
        actor_user_id: user.id,
        action: 'dependency_delete',
        entity: 'job_dependencies',
        record_id: dependency_id,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Dependency deleted successfully',
        } as DependencyResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // CHECK: Check if job can run
    if (action === 'check') {
      if (!job_id) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'job_id required',
            error_code: 'INVALID_INPUT',
          } as DependencyResponse),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: checkResult, error: checkError } = await supabase.rpc('fn_check_job_dependencies', {
        p_job_id: job_id,
      });

      if (checkError) {
        throw new Error(`Failed to check dependencies: ${checkError.message}`);
      }

      const result = checkResult?.[0] || { can_run: true, blocking_jobs: [], message: 'No dependencies' };

      return new Response(
        JSON.stringify({
          success: true,
          data: result,
        } as DependencyResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // TREE: Get dependency tree
    if (action === 'tree') {
      const { data: tree, error: treeError } = await supabase.rpc('fn_get_job_dependency_tree', {
        p_job_id: job_id || null,
      });

      if (treeError) {
        throw new Error(`Failed to get dependency tree: ${treeError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          tree: tree || [],
        } as DependencyResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid action',
        error_code: 'INVALID_ACTION',
      } as DependencyResponse),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in gate-n-dependencies:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error?.message || 'Internal server error',
        error_code: 'INTERNAL_ERROR',
      } as DependencyResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
