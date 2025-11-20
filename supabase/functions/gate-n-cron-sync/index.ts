import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CronSyncResponse {
  success: boolean;
  message?: string;
  synced_jobs?: any[];
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
        } as CronSyncResponse),
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
        } as CronSyncResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Admin role required',
          error_code: 'FORBIDDEN',
        } as CronSyncResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { action, job_id, job_key, schedule_cron } = await req.json();

    if (action === 'sync_all') {
      // Get all enabled jobs with schedule_cron
      const { data: jobs, error: jobsError } = await supabase
        .from('system_jobs')
        .select('*')
        .eq('tenant_id', tenantData.tenant_id)
        .eq('is_enabled', true)
        .not('schedule_cron', 'is', null);

      if (jobsError) {
        throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
      }

      const syncedJobs = [];
      const projectRef = Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0];
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

      for (const job of jobs || []) {
        const cronName = `job_${job.job_key}_${tenantData.tenant_id}`.substring(0, 63);
        
        // Delete existing cron job if exists (ignore errors)
        try {
          await supabase.rpc('cron.unschedule', { job_name: cronName });
        } catch {}


        // Create new cron job
        const cronSchedule = job.schedule_cron;
        const functionUrl = `https://${projectRef}.supabase.co/functions/v1/gate-n-trigger`;
        
        const { error: cronError } = await supabase.rpc('cron.schedule', {
          job_name: cronName,
          schedule: cronSchedule,
          command: `
            SELECT net.http_post(
              url:='${functionUrl}',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${anonKey}"}'::jsonb,
              body:='{"job_key": "${job.job_key}"}'::jsonb
            );
          `,
        });

        if (!cronError) {
          syncedJobs.push({
            job_key: job.job_key,
            cron_name: cronName,
            schedule: cronSchedule,
          });
        }
      }

      // Log audit
      await supabase.from('audit_log').insert({
        tenant_id: tenantData.tenant_id,
        actor_user_id: user.id,
        action: 'cron_sync_all',
        entity: 'system_jobs',
        new_values: { synced_count: syncedJobs.length },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Synced ${syncedJobs.length} jobs`,
          synced_jobs: syncedJobs,
        } as CronSyncResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'create' || action === 'update') {
      if (!job_key || !schedule_cron) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'job_key and schedule_cron required',
            error_code: 'INVALID_INPUT',
          } as CronSyncResponse),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const cronName = `job_${job_key}_${tenantData.tenant_id}`.substring(0, 63);
      const projectRef = Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0];
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
      const functionUrl = `https://${projectRef}.supabase.co/functions/v1/gate-n-trigger`;

      // Delete existing if update
      if (action === 'update') {
        try {
          await supabase.rpc('cron.unschedule', { job_name: cronName });
        } catch {}
      }

      // Create cron job
      const { error: cronError } = await supabase.rpc('cron.schedule', {
        job_name: cronName,
        schedule: schedule_cron,
        command: `
          SELECT net.http_post(
            url:='${functionUrl}',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${anonKey}"}'::jsonb,
            body:='{"job_key": "${job_key}"}'::jsonb
          );
        `,
      });

      if (cronError) {
        throw new Error(`Failed to create cron job: ${cronError.message}`);
      }

      // Log audit
      await supabase.from('audit_log').insert({
        tenant_id: tenantData.tenant_id,
        actor_user_id: user.id,
        action: `cron_${action}`,
        entity: 'system_jobs',
        record_id: job_id || null,
        new_values: { job_key, schedule_cron, cron_name: cronName },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Cron job ${action}d successfully`,
        } as CronSyncResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'delete') {
      if (!job_key) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'job_key required',
            error_code: 'INVALID_INPUT',
          } as CronSyncResponse),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const cronName = `job_${job_key}_${tenantData.tenant_id}`.substring(0, 63);
      
      try {
        await supabase.rpc('cron.unschedule', { job_name: cronName });
      } catch {}


      // Log audit
      await supabase.from('audit_log').insert({
        tenant_id: tenantData.tenant_id,
        actor_user_id: user.id,
        action: 'cron_delete',
        entity: 'system_jobs',
        record_id: job_id || null,
        new_values: { job_key, cron_name: cronName },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cron job deleted successfully',
        } as CronSyncResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'list') {
      // Get cron jobs from cron.job table
      const { data: cronJobs, error: cronError } = await supabase
        .from('cron.job')
        .select('*')
        .like('jobname', `job_%_${tenantData.tenant_id}%`);

      return new Response(
        JSON.stringify({
          success: true,
          synced_jobs: cronJobs || [],
        } as CronSyncResponse),
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
      } as CronSyncResponse),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in gate-n-cron-sync:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error?.message || 'Internal server error',
        error_code: 'INTERNAL_ERROR',
      } as CronSyncResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
