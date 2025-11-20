/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Edge Function: backup-retention-cleanup
 * Purpose: حذف النسخ الاحتياطية القديمة حسب سياسة الاحتفاظ
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  scheduleId: string;
  scheduleName: string;
  deletedCount: number;
  freedSpace: number;
  errors: string[];
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] Backup Retention cleanup starting...`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all schedules with retention policies
    const { data: schedules, error: schedulesError } = await supabase
      .from('backup_schedules')
      .select('*')
      .not('retention_days', 'is', null);

    if (schedulesError) {
      throw new Error(`Failed to fetch schedules: ${schedulesError.message}`);
    }

    if (!schedules || schedules.length === 0) {
      console.log(`[${requestId}] No schedules with retention policies found`);
      return new Response(
        JSON.stringify({ 
          message: 'No retention policies to apply', 
          cleaned: 0,
          requestId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const results: CleanupResult[] = [];

    for (const schedule of schedules) {
      try {
        const errors: string[] = [];
        let deletedCount = 0;
        let freedSpace = 0;

        console.log(`[Backup Retention] Processing schedule: ${schedule.schedule_name}`);

        // Calculate retention cutoff date
        const retentionDays = schedule.retention_days || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        // Get old backups for this schedule
        const { data: oldBackups, error: fetchError } = await supabase
          .from('backup_jobs')
          .select('*')
          .eq('tenant_id', schedule.tenant_id)
          .eq('status', 'completed')
          .lt('created_at', cutoffDate.toISOString())
          .contains('metadata', { schedule_id: schedule.id });

        if (fetchError) {
          throw new Error(`Failed to fetch old backups: ${fetchError.message}`);
        }

        if (!oldBackups || oldBackups.length === 0) {
          console.log(`[Backup Retention] No old backups found for schedule: ${schedule.schedule_name}`);
          results.push({
            scheduleId: schedule.id,
            scheduleName: schedule.schedule_name,
            deletedCount: 0,
            freedSpace: 0,
            errors: [],
          });
          continue;
        }

        // Apply max_backups_count policy if set
        let backupsToDelete = [...oldBackups];
        
        if (schedule.max_backups_count && schedule.max_backups_count > 0) {
          // Get all backups for this schedule
          const { data: allBackups, error: allError } = await supabase
            .from('backup_jobs')
            .select('*')
            .eq('tenant_id', schedule.tenant_id)
            .eq('status', 'completed')
            .contains('metadata', { schedule_id: schedule.id })
            .order('created_at', { ascending: false });

          if (!allError && allBackups && allBackups.length > schedule.max_backups_count) {
            // Keep only the newest max_backups_count backups
            const backupsToKeep = allBackups.slice(0, schedule.max_backups_count);
            const keepIds = new Set(backupsToKeep.map(b => b.id));
            
            // Add backups exceeding max count to deletion list
            const excessBackups = allBackups.filter(b => !keepIds.has(b.id));
            backupsToDelete = [...new Set([...backupsToDelete, ...excessBackups])];
          }
        }

        // Delete old backups
        for (const backup of backupsToDelete) {
          try {
            // Delete from storage if exists
            if (backup.storage_path && backup.storage_bucket) {
              const { error: storageError } = await supabase.storage
                .from(backup.storage_bucket)
                .remove([backup.storage_path]);

              if (storageError) {
                console.error(`[Backup Retention] Failed to delete storage file: ${storageError.message}`);
                errors.push(`Storage deletion failed for ${backup.backup_name}: ${storageError.message}`);
              }
            }

            // Delete backup job record
            const { error: deleteError } = await supabase
              .from('backup_jobs')
              .delete()
              .eq('id', backup.id);

            if (deleteError) {
              throw new Error(`Failed to delete backup job: ${deleteError.message}`);
            }

            deletedCount++;
            freedSpace += backup.backup_size_bytes || 0;

            console.log(`[Backup Retention] Deleted backup: ${backup.backup_name}`);

          } catch (backupError) {
            const errorMsg = backupError instanceof Error ? backupError.message : String(backupError);
            console.error(`[Backup Retention] Error deleting backup ${backup.id}:`, backupError);
            errors.push(`Failed to delete ${backup.backup_name}: ${errorMsg}`);
          }
        }

        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.schedule_name,
          deletedCount,
          freedSpace,
          errors,
        });

        console.log(`[Backup Retention] Schedule \"${schedule.schedule_name}\": Deleted ${deletedCount} backups, Freed ${formatBytes(freedSpace)}`);

      } catch (scheduleError) {
        const errorMsg = scheduleError instanceof Error ? scheduleError.message : String(scheduleError);
        console.error(`[Backup Retention] Error processing schedule ${schedule.id}:`, scheduleError);
        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.schedule_name,
          deletedCount: 0,
          freedSpace: 0,
          errors: [errorMsg],
        });
      }
    }

    const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);
    const totalFreed = results.reduce((sum, r) => sum + r.freedSpace, 0);

    console.log(`[Backup Retention] Cleanup completed. Total deleted: ${totalDeleted}, Total freed: ${formatBytes(totalFreed)}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalDeleted,
        totalFreed,
        totalFreedFormatted: formatBytes(totalFreed),
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Backup Retention] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
