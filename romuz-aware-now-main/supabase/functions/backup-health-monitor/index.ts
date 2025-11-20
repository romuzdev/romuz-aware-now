/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Edge Function: Backup Health Monitoring
 * Purpose: Monitor and report backup system health
 * Scheduled: Runs every hour via cron
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getTenantId } from "../_shared/tenant-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthStatus {
  health_status: 'healthy' | 'warning' | 'critical';
  health_score: number;
  issues: any[];
  warnings: any[];
  recommendations: string[];
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] Starting backup health monitoring...`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('status', 'ACTIVE');

    if (tenantsError) {
      throw new Error(`Failed to fetch tenants: ${tenantsError.message}`);
    }

    if (!tenants || tenants.length === 0) {
      console.log(`[${requestId}] No active tenants found`);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No active tenants to monitor',
          requestId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`[${requestId}] Monitoring ${tenants.length} tenants...`);

    // Monitor each tenant
    const results = [];
    for (const tenant of tenants) {
      try {
        const healthStatus = await monitorTenantHealth(supabase, tenant.id);
        results.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          ...healthStatus,
        });

        // Store health snapshot
        await supabase
          .from('backup_health_monitoring')
          .insert({
            tenant_id: tenant.id,
            checked_at: new Date().toISOString(),
            health_status: healthStatus.health_status,
            health_score: healthStatus.health_score,
            total_backups: healthStatus.metrics.total_backups,
            successful_backups: healthStatus.metrics.successful_backups,
            failed_backups: healthStatus.metrics.failed_backups,
            last_backup_at: healthStatus.metrics.last_backup_at,
            next_scheduled_backup: healthStatus.metrics.next_scheduled_backup,
            total_storage_bytes: healthStatus.metrics.total_storage_bytes,
            storage_growth_rate: healthStatus.metrics.storage_growth_rate,
            storage_utilization_pct: healthStatus.metrics.storage_utilization_pct,
            avg_backup_duration_seconds: healthStatus.metrics.avg_backup_duration,
            avg_restore_duration_seconds: healthStatus.metrics.avg_restore_duration,
            last_successful_restore_at: healthStatus.metrics.last_restore_at,
            rto_compliance_pct: healthStatus.compliance.rto_compliance,
            rpo_compliance_pct: healthStatus.compliance.rpo_compliance,
            retention_compliance_pct: healthStatus.compliance.retention_compliance,
            active_issues: healthStatus.issues,
            warnings: healthStatus.warnings,
            recommendations: healthStatus.recommendations,
          });

        console.log(`Tenant ${tenant.name}: ${healthStatus.health_status} (${healthStatus.health_score}/100)`);

      } catch (error) {
        console.error(`Failed to monitor tenant ${tenant.name}:`, error);
        results.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        monitored_tenants: tenants.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Health monitoring error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function monitorTenantHealth(
  supabase: any,
  tenantId: string
): Promise<HealthStatus & { metrics: any; compliance: any }> {
  const issues: any[] = [];
  const warnings: any[] = [];
  const recommendations: string[] = [];

  // Get backup metrics
  const metrics = await getBackupMetrics(supabase, tenantId);
  
  // Check backup health
  const backupHealth = await checkBackupHealth(supabase, tenantId, metrics);
  issues.push(...backupHealth.issues);
  warnings.push(...backupHealth.warnings);

  // Check compliance
  const compliance = await checkCompliance(supabase, tenantId);
  if (compliance.rto_compliance < 90) {
    warnings.push({
      type: 'compliance',
      message: `RTO compliance is low: ${compliance.rto_compliance}%`,
    });
  }
  if (compliance.rpo_compliance < 90) {
    warnings.push({
      type: 'compliance',
      message: `RPO compliance is low: ${compliance.rpo_compliance}%`,
    });
  }

  // Check storage
  const storageCheck = await checkStorage(supabase, tenantId, metrics);
  warnings.push(...storageCheck.warnings);
  recommendations.push(...storageCheck.recommendations);

  // Calculate health score
  const { data: scoreData } = await supabase.rpc(
    'calculate_backup_health_score',
    { p_tenant_id: tenantId }
  );
  const healthScore = scoreData || 0;

  // Determine health status
  let healthStatus: 'healthy' | 'warning' | 'critical';
  if (healthScore >= 80 && issues.length === 0) {
    healthStatus = 'healthy';
  } else if (healthScore >= 60 || issues.length > 0) {
    healthStatus = 'warning';
  } else {
    healthStatus = 'critical';
  }

  // Generate recommendations
  if (metrics.failed_backups > 0) {
    recommendations.push('Review and resolve failed backup jobs');
  }
  if (!metrics.last_backup_at || 
      (Date.now() - new Date(metrics.last_backup_at).getTime()) > 86400000) {
    recommendations.push('Schedule more frequent backups');
  }
  if (metrics.storage_utilization_pct > 80) {
    recommendations.push('Consider implementing retention policies to manage storage');
  }

  return {
    health_status: healthStatus,
    health_score: healthScore,
    issues,
    warnings,
    recommendations,
    metrics,
    compliance,
  };
}

async function getBackupMetrics(supabase: any, tenantId: string) {
  // Get backup statistics
  const { data: backups } = await supabase
    .from('backup_jobs')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()); // Last 30 days

  const totalBackups = backups?.length || 0;
  const successfulBackups = backups?.filter((b: any) => b.status === 'completed').length || 0;
  const failedBackups = backups?.filter((b: any) => b.status === 'failed').length || 0;

  const lastBackup = backups?.sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  // Calculate storage metrics
  const totalStorage = backups
    ?.filter((b: any) => b.status === 'completed')
    .reduce((sum: number, b: any) => sum + (b.backup_size_bytes || 0), 0) || 0;

  // Calculate average durations
  const avgBackupDuration = backups?.length > 0
    ? backups.reduce((sum: number, b: any) => sum + (b.duration_seconds || 0), 0) / backups.length
    : 0;

  // Get next scheduled backup
  const { data: nextSchedule } = await supabase
    .from('backup_schedules')
    .select('next_run_at')
    .eq('tenant_id', tenantId)
    .eq('is_enabled', true)
    .order('next_run_at', { ascending: true })
    .limit(1)
    .single();

  // Get last restore
  const { data: lastRestore } = await supabase
    .from('backup_restore_logs')
    .select('completed_at, duration_seconds')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  // Calculate storage growth rate (MB per day)
  const storageGrowthRate = backups?.length > 1
    ? (totalStorage / (1024 * 1024)) / 30 // MB per day over last 30 days
    : 0;

  return {
    total_backups: totalBackups,
    successful_backups: successfulBackups,
    failed_backups: failedBackups,
    last_backup_at: lastBackup?.created_at || null,
    next_scheduled_backup: nextSchedule?.next_run_at || null,
    total_storage_bytes: totalStorage,
    storage_growth_rate: Math.round(storageGrowthRate * 100) / 100,
    storage_utilization_pct: (totalStorage / (100 * 1024 * 1024 * 1024)) * 100, // Assuming 100GB limit
    avg_backup_duration: Math.round(avgBackupDuration),
    avg_restore_duration: lastRestore?.duration_seconds || null,
    last_restore_at: lastRestore?.completed_at || null,
  };
}

async function checkBackupHealth(
  supabase: any,
  tenantId: string,
  metrics: any
) {
  const issues: any[] = [];
  const warnings: any[] = [];

  // Check for recent failed backups
  if (metrics.failed_backups > 0) {
    issues.push({
      type: 'failed_backups',
      severity: metrics.failed_backups > 3 ? 'critical' : 'warning',
      message: `${metrics.failed_backups} backup(s) failed in the last 30 days`,
    });
  }

  // Check last backup age
  if (metrics.last_backup_at) {
    const hoursSinceLastBackup = 
      (Date.now() - new Date(metrics.last_backup_at).getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastBackup > 48) {
      issues.push({
        type: 'stale_backup',
        severity: 'critical',
        message: `Last backup was ${Math.round(hoursSinceLastBackup)} hours ago`,
      });
    } else if (hoursSinceLastBackup > 24) {
      warnings.push({
        type: 'aging_backup',
        message: `Last backup was ${Math.round(hoursSinceLastBackup)} hours ago`,
      });
    }
  } else {
    issues.push({
      type: 'no_backup',
      severity: 'critical',
      message: 'No backups found',
    });
  }

  // Check if schedules are active
  const { data: activeSchedules } = await supabase
    .from('backup_schedules')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_enabled', true);

  if (!activeSchedules || activeSchedules.length === 0) {
    warnings.push({
      type: 'no_schedule',
      message: 'No active backup schedules configured',
    });
  }

  return { issues, warnings };
}

async function checkCompliance(supabase: any, tenantId: string) {
  // Get active DR plans
  const { data: drPlans } = await supabase
    .from('backup_disaster_recovery_plans')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (!drPlans || drPlans.length === 0) {
    return {
      rto_compliance: 0,
      rpo_compliance: 0,
      retention_compliance: 0,
    };
  }

  // Calculate compliance metrics
  let rtoCompliant = 0;
  let rpoCompliant = 0;
  let retentionCompliant = 0;

  for (const plan of drPlans) {
    // Check RPO compliance (backup frequency vs RPO)
    const { data: recentBackups } = await supabase
      .from('backup_jobs')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - plan.rpo_minutes * 60 * 1000).toISOString());

    if (recentBackups && recentBackups.length > 0) {
      rpoCompliant++;
    }

    // Check retention compliance
    const { data: oldBackups } = await supabase
      .from('backup_jobs')
      .select('id')
      .eq('tenant_id', tenantId)
      .lte('created_at', new Date(Date.now() - plan.retention_days * 86400000).toISOString());

    // If old backups exist, retention policy might not be enforced
    if (!oldBackups || oldBackups.length === 0) {
      retentionCompliant++;
    }

    // RTO is checked during restore operations
    rtoCompliant++; // Assume compliant for now
  }

  return {
    rto_compliance: drPlans.length > 0 ? (rtoCompliant / drPlans.length) * 100 : 0,
    rpo_compliance: drPlans.length > 0 ? (rpoCompliant / drPlans.length) * 100 : 0,
    retention_compliance: drPlans.length > 0 ? (retentionCompliant / drPlans.length) * 100 : 0,
  };
}

async function checkStorage(
  supabase: any,
  tenantId: string,
  metrics: any
) {
  const warnings: any[] = [];
  const recommendations: string[] = [];

  // Check storage utilization
  if (metrics.storage_utilization_pct > 90) {
    warnings.push({
      type: 'storage_critical',
      message: `Storage utilization is at ${Math.round(metrics.storage_utilization_pct)}%`,
    });
    recommendations.push('Implement aggressive retention policies');
    recommendations.push('Consider archiving old backups to cold storage');
  } else if (metrics.storage_utilization_pct > 80) {
    warnings.push({
      type: 'storage_warning',
      message: `Storage utilization is at ${Math.round(metrics.storage_utilization_pct)}%`,
    });
    recommendations.push('Review retention policies');
  }

  // Check storage growth rate
  if (metrics.storage_growth_rate > 1000) { // > 1GB per day
    recommendations.push(
      'High storage growth rate detected. Consider incremental backups.'
    );
  }

  return { warnings, recommendations };
}
