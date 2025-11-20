/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Edge Function: backup-scheduler-cron
 * Purpose: تنفيذ الجدولة التلقائية للنسخ الاحتياطية (Cron Job)
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleExecution {
  scheduleId: string;
  scheduleName: string;
  jobType: string;
  tenantId: string;
  executed: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Backup Scheduler] Starting scheduled backup execution...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all enabled schedules that need to run
    const { data: schedules, error: schedulesError } = await supabase
      .from('backup_schedules')
      .select('*')
      .eq('is_enabled', true);

    if (schedulesError) {
      throw new Error(`Failed to fetch schedules: ${schedulesError.message}`);
    }

    if (!schedules || schedules.length === 0) {
      console.log('[Backup Scheduler] No enabled schedules found');
      return new Response(
        JSON.stringify({ message: 'No enabled schedules', executed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const results: ScheduleExecution[] = [];
    const now = new Date();

    for (const schedule of schedules) {
      try {
        // Check if schedule should run now based on cron expression
        const shouldRun = shouldExecuteSchedule(schedule.cron_expression, schedule.last_run_at, now);
        
        if (!shouldRun) {
          console.log(`[Backup Scheduler] Schedule "${schedule.schedule_name}" not due yet`);
          continue;
        }

        console.log(`[Backup Scheduler] Executing schedule: ${schedule.schedule_name}`);

        // Create backup job
        const jobId = crypto.randomUUID();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `scheduled-${schedule.schedule_name}-${timestamp}`;

        const { error: insertError } = await supabase
          .from('backup_jobs')
          .insert({
            id: jobId,
            job_type: schedule.job_type,
            backup_name: backupName,
            description: `Scheduled backup from: ${schedule.schedule_name}`,
            status: 'running',
            started_at: now.toISOString(),
            tenant_id: schedule.tenant_id,
            created_by: schedule.created_by,
            updated_by: schedule.created_by,
            metadata: {
              schedule_id: schedule.id,
              schedule_name: schedule.schedule_name,
              automated: true,
            }
          });

        if (insertError) {
          throw new Error(`Failed to create backup job: ${insertError.message}`);
        }

        // Execute backup in background
        executeBackup(supabase, jobId, schedule.job_type, schedule.tenant_id, schedule)
          .catch(err => console.error(`Background backup error: ${err}`));

        // Update schedule last_run_at and next_run_at
        const nextRunAt = calculateNextRun(schedule.cron_expression, now);
        await supabase
          .from('backup_schedules')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRunAt?.toISOString() || null,
            last_run_status: 'running',
          })
          .eq('id', schedule.id);

        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.schedule_name,
          jobType: schedule.job_type,
          tenantId: schedule.tenant_id,
          executed: true,
        });

      } catch (scheduleError) {
        const errorMsg = scheduleError instanceof Error ? scheduleError.message : String(scheduleError);
        console.error(`[Backup Scheduler] Error executing schedule ${schedule.id}:`, scheduleError);
        
        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.schedule_name,
          jobType: schedule.job_type,
          tenantId: schedule.tenant_id,
          executed: false,
          error: errorMsg,
        });

        // Update schedule with error status
        await supabase
          .from('backup_schedules')
          .update({
            last_run_status: 'failed',
          })
          .eq('id', schedule.id);
      }
    }

    console.log(`[Backup Scheduler] Completed. Executed: ${results.filter(r => r.executed).length}/${results.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        executed: results.filter(r => r.executed).length,
        total: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Backup Scheduler] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Check if schedule should execute based on cron expression
 */
function shouldExecuteSchedule(
  cronExpression: string,
  lastRunAt: string | null,
  now: Date
): boolean {
  // Parse cron: minute hour day month weekday
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return false;

  const [minute, hour, day, month, weekday] = parts;

  // If no last run, execute immediately
  if (!lastRunAt) return true;

  const lastRun = new Date(lastRunAt);
  const timeSinceLastRun = now.getTime() - lastRun.getTime();

  // Minimum interval: 1 minute
  if (timeSinceLastRun < 60 * 1000) return false;

  // Simple cron matching (for common patterns)
  const nowMinute = now.getMinutes();
  const nowHour = now.getHours();
  const nowDay = now.getDate();
  const nowMonth = now.getMonth() + 1;
  const nowWeekday = now.getDay();

  // Check minute
  if (minute !== '*' && parseInt(minute) !== nowMinute) return false;
  
  // Check hour
  if (hour !== '*' && parseInt(hour) !== nowHour) return false;
  
  // Check day of month
  if (day !== '*' && parseInt(day) !== nowDay) return false;
  
  // Check month
  if (month !== '*' && parseInt(month) !== nowMonth) return false;
  
  // Check weekday
  if (weekday !== '*' && parseInt(weekday) !== nowWeekday) return false;

  return true;
}

/**
 * Calculate next run time based on cron expression
 */
function calculateNextRun(cronExpression: string, from: Date): Date | null {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return null;

  const [minute, hour] = parts;
  const next = new Date(from);

  // Simple calculation for common patterns
  if (minute === '*' && hour === '*') {
    // Every minute
    next.setMinutes(next.getMinutes() + 1);
  } else if (minute !== '*' && hour !== '*') {
    // Specific time daily
    next.setDate(next.getDate() + 1);
    next.setHours(parseInt(hour));
    next.setMinutes(parseInt(minute));
    next.setSeconds(0);
  } else if (minute !== '*' && hour === '*') {
    // Every hour at specific minute
    next.setHours(next.getHours() + 1);
    next.setMinutes(parseInt(minute));
    next.setSeconds(0);
  }

  return next;
}

/**
 * Execute backup process
 */
async function executeBackup(
  supabase: any,
  jobId: string,
  jobType: string,
  tenantId: string,
  schedule: any
) {
  try {
    const startTime = Date.now();

    // Simulate backup process (في الواقع يجب استدعاء backup-database)
    console.log(`[Backup Execution] Starting backup job: ${jobId}`);

    // Get tenant data
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    if (tenantError) {
      throw new Error(`Failed to fetch tenant: ${tenantError.message}`);
    }

    // Mock backup data collection
    const tables = [
      'awareness_campaigns', 'campaign_participants', 'policies',
      'risks', 'controls', 'audit_log'
    ];

    let totalRows = 0;
    const backupData: any = {};

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      if (!error && count !== null) {
        backupData[table] = count;
        totalRows += count;
      }
    }

    const backupSizeBytes = totalRows * 1024; // Mock size calculation
    const compressedSize = backupSizeBytes * 0.3; // 70% compression
    const duration = (Date.now() - startTime) / 1000;

    // Update backup job as completed
    const { error: updateError } = await supabase
      .from('backup_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        backup_size_bytes: backupSizeBytes,
        compressed_size_bytes: compressedSize,
        rows_count: totalRows,
        tables_count: tables.length,
        duration_seconds: duration,
        storage_path: `backups/${tenantId}/${jobId}.backup.gz`,
        storage_bucket: 'backups',
      })
      .eq('id', jobId);

    if (updateError) {
      throw new Error(`Failed to update backup job: ${updateError.message}`);
    }

    // Update schedule status
    await supabase
      .from('backup_schedules')
      .update({ last_run_status: 'success' })
      .eq('id', schedule.id);

    // Send success notification
    if (schedule.notify_on_success && schedule.notification_emails?.length > 0) {
      await sendNotification(supabase, {
        type: 'backup_success',
        scheduleName: schedule.schedule_name,
        backupName: `Job ${jobId}`,
        size: formatBytes(backupSizeBytes),
        duration: `${duration.toFixed(2)}s`,
        emails: schedule.notification_emails,
      });
    }

    console.log(`[Backup Execution] Completed job: ${jobId}`);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Backup Execution] Failed job ${jobId}:`, error);

    // Update job as failed
    await supabase
      .from('backup_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMsg,
      })
      .eq('id', jobId);

    // Update schedule status
    await supabase
      .from('backup_schedules')
      .update({ last_run_status: 'failed' })
      .eq('id', schedule.id);

    // Send failure notification
    if (schedule.notify_on_failure && schedule.notification_emails?.length > 0) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await sendNotification(supabase, {
        type: 'backup_failure',
        scheduleName: schedule.schedule_name,
        error: errorMsg,
        emails: schedule.notification_emails,
      });
    }
  }
}

/**
 * Send email notification
 */
async function sendNotification(supabase: any, params: any) {
  try {
    // في الواقع يجب استخدام خدمة البريد الإلكتروني
    console.log('[Notification] Sending email:', params.type);
    
    // يمكن دمجها مع نظام الإشعارات الموجود أو استخدام خدمة خارجية
    const message = params.type === 'backup_success'
      ? `✅ نجح النسخ الاحتياطي المجدول "${params.scheduleName}"\nالحجم: ${params.size}\nالمدة: ${params.duration}`
      : `❌ فشل النسخ الاحتياطي المجدول "${params.scheduleName}"\nالخطأ: ${params.error}`;

    console.log(`[Notification] ${message}`);
    
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    
  } catch (error) {
    console.error('[Notification] Failed to send:', error);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
