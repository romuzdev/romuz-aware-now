/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Edge Function: backup-database
 * Purpose: تنفيذ عمليات النسخ الاحتياطي للبيانات
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { validateBackupRequest } from "../_shared/simple-validation.ts";
import { checkRateLimit, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { getTenantId } from "../_shared/tenant-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupRequest {
  jobType: 'full' | 'incremental' | 'snapshot';
  backupName?: string;
  description?: string;
  tables?: string[]; // للنسخ الجزئي
}

interface BackupResult {
  success: boolean;
  jobId: string;
  backupSizeBytes?: number;
  tablesCount?: number;
  error?: string;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] Backup request received`);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Get tenant ID using unified utility
    const tenantId = await getTenantId(supabase as any, user.id);
    console.log(`[${requestId}] User: ${user.id}, Tenant: ${tenantId}`);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      tenantId,
      RATE_LIMITS.BACKUP_CREATE
    );

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      console.warn(`[${requestId}] Rate limit exceeded for tenant: ${tenantId}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = validateBackupRequest(body);
    
    if (!validationResult.success) {
      console.warn(`[${requestId}] Validation failed:`, validationResult.details);
      return new Response(
        JSON.stringify({ 
          error: validationResult.error,
          details: validationResult.details 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const { jobType, backupName, description, tables } = body;
    console.log(`[${requestId}] Starting ${jobType} backup`);

    // Create backup job record
    const jobId = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const generatedBackupName = backupName || `backup-${jobType}-${timestamp}`;

    const { error: insertError } = await supabase
      .from('backup_jobs')
      .insert({
        id: jobId,
        job_type: jobType,
        backup_name: generatedBackupName,
        description: description || `${jobType} backup created at ${new Date().toISOString()}`,
        status: 'running',
        started_at: new Date().toISOString(),
        tenant_id: tenantId,
        created_by: user.id,
        updated_by: user.id,
        metadata: {
          user_email: user.email,
          tables: tables || [],
        }
      });

    if (insertError) {
      throw new Error(`Failed to create backup job: ${insertError.message}`);
    }

    // Start backup process (async)
    performBackup(supabase, jobId, jobType, tenantId, tables).catch((error) => {
      console.error('[Backup] Error during backup execution:', error);
    });

    // Return immediate response
    const result: BackupResult = {
      success: true,
      jobId,
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[Backup] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const result: BackupResult = {
      success: false,
      jobId: '',
      error: errorMessage,
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Perform the actual backup operation
 */
async function performBackup(
  supabase: any,
  jobId: string,
  jobType: string,
  tenantId: string,
  tables?: string[]
): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log(`[Backup] Executing ${jobType} backup for job: ${jobId}`);

    // Define tables to backup (only existing tables from schema)
    const tablesToBackup = tables || [
      'awareness_campaigns',
      'campaign_participants',
      'campaign_modules',
      'campaign_feedback',
      'policies',
      'grc_risks',
      'grc_controls',
      'grc_compliance_frameworks',
      'grc_compliance_requirements',
      'action_plan_milestones',
      'action_plan_dependencies',
      'action_plan_tracking',
      'grc_audits',
      'grc_audit_findings',
      'audit_workflows',
      'documents',
      'attachments',
    ];

    let totalSizeBytes = 0;
    let totalRows = 0;
    const backupData: any = {};

    // Backup each table
    for (const tableName of tablesToBackup) {
      try {
        console.log(`[Backup] Backing up table: ${tableName}`);
        
        // Fetch data for this table (filtered by tenant)
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .eq('tenant_id', tenantId);

        if (error) {
          console.error(`[Backup] Error backing up ${tableName}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          backupData[tableName] = data;
          totalRows += data.length;
          
          // Estimate size (rough calculation)
          const dataSize = JSON.stringify(data).length;
          totalSizeBytes += dataSize;
          
          console.log(`[Backup] Backed up ${data.length} rows from ${tableName}`);
        }
      } catch (tableError) {
        console.error(`[Backup] Error processing table ${tableName}:`, tableError);
      }
    }

    // Convert to JSON
    const backupJson = JSON.stringify(backupData, null, 2);
    const backupBlob = new Blob([backupJson], { type: 'application/json' });
    
    // Upload to storage
    const storagePath = `${tenantId}/${jobId}-backup.json`;
    const { error: uploadError } = await supabase.storage
      .from('backups')
      .upload(storagePath, backupBlob, {
        contentType: 'application/json',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload backup: ${uploadError.message}`);
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Update job status to completed
    const { error: updateError } = await supabase
      .from('backup_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        backup_size_bytes: totalSizeBytes,
        compressed_size_bytes: backupBlob.size,
        storage_path: storagePath,
        tables_count: tablesToBackup.length,
        rows_count: totalRows,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('[Backup] Failed to update job status:', updateError);
    }

    console.log(`[Backup] Completed successfully. Duration: ${duration}s, Size: ${totalSizeBytes} bytes`);

  } catch (error) {
    console.error('[Backup] Fatal error during backup:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update job status to failed
    await supabase
      .from('backup_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
        error_details: { 
          error: error?.toString() || 'Unknown error',
          stack: errorStack
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}
