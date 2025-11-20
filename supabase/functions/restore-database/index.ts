/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Edge Function: restore-database
 * Purpose: استعادة البيانات من النسخ الاحتياطية
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { validateRestoreRequest } from "../_shared/simple-validation.ts";
import { checkRateLimit, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { getTenantId } from "../_shared/tenant-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RestoreRequest {
  backupJobId: string;
  restoreType: 'full' | 'partial';
  tables?: string[]; // للاستعادة الجزئية
  confirmRestore: boolean;
}

interface RestoreResult {
  success: boolean;
  restoreLogId: string;
  tablesRestored?: number;
  rowsRestored?: number;
  error?: string;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] Restore request received`);

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

    // Rate limiting (stricter for restore operations)
    const rateLimitResult = await checkRateLimit(
      tenantId,
      RATE_LIMITS.RESTORE_EXECUTE
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
    const validationResult = validateRestoreRequest(body);
    
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

    const { backupJobId, restoreType, tables, confirmRestore } = body;
    console.log(`[${requestId}] Starting ${restoreType} restore for backup: ${backupJobId}`);

    // Safety check
    if (!confirmRestore) {
      throw new Error('Restore operation must be explicitly confirmed');
    }

    // Fetch backup job details
    const { data: backupJob, error: backupError } = await supabase
      .from('backup_jobs')
      .select('*')
      .eq('id', backupJobId)
      .eq('tenant_id', tenantId)
      .single();

    if (backupError || !backupJob) {
      throw new Error('Backup job not found or access denied');
    }

    if (backupJob.status !== 'completed') {
      throw new Error('Cannot restore from incomplete backup');
    }

    // Create restore log
    const restoreLogId = crypto.randomUUID();
    const { error: logError } = await supabase
      .from('backup_restore_logs')
      .insert({
        id: restoreLogId,
        backup_job_id: backupJobId,
        restore_type: restoreType,
        status: 'running',
        started_at: new Date().toISOString(),
        tenant_id: tenantId,
        created_by: user.id,
        initiated_by: user.id,
        metadata: {
          user_email: user.email,
          backup_name: backupJob.backup_name,
          tables: tables || [],
        }
      });

    if (logError) {
      throw new Error(`Failed to create restore log: ${logError.message}`);
    }

    // Start restore process (async)
    performRestore(
      supabase,
      restoreLogId,
      backupJob,
      restoreType,
      tenantId,
      tables
    ).catch((error) => {
      console.error('[Restore] Error during restore execution:', error);
    });

    // Return immediate response
    const result: RestoreResult = {
      success: true,
      restoreLogId,
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[Restore] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const result: RestoreResult = {
      success: false,
      restoreLogId: '',
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
 * Perform the actual restore operation
 */
async function performRestore(
  supabase: any,
  restoreLogId: string,
  backupJob: any,
  restoreType: string,
  tenantId: string,
  tables?: string[]
): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log(`[Restore] Executing ${restoreType} restore for log: ${restoreLogId}`);

    // Download backup file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('backups')
      .download(backupJob.storage_path);

    if (downloadError) {
      throw new Error(`Failed to download backup: ${downloadError.message}`);
    }

    // Parse backup data
    const backupText = await fileData.text();
    const backupData = JSON.parse(backupText);

    let tablesRestored = 0;
    let rowsRestored = 0;

    // Determine which tables to restore
    const tablesToRestore = tables || Object.keys(backupData);

    // Restore each table
    for (const tableName of tablesToRestore) {
      if (!backupData[tableName]) {
        console.log(`[Restore] No data for table: ${tableName}`);
        continue;
      }

      try {
        console.log(`[Restore] Restoring table: ${tableName}`);
        
        const tableData = backupData[tableName];
        
        // For safety: only restore data for this tenant
        const filteredData = Array.isArray(tableData) 
          ? tableData.filter((row: any) => row.tenant_id === tenantId)
          : [];

        if (filteredData.length === 0) {
          console.log(`[Restore] No tenant-specific data for: ${tableName}`);
          continue;
        }

        // Delete existing data (optional - can be made configurable)
        console.log(`[Restore] Clearing existing data from: ${tableName}`);
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('tenant_id', tenantId);

        if (deleteError) {
          console.error(`[Restore] Error deleting from ${tableName}:`, deleteError);
        }

        // Insert restored data in batches (Supabase has limits)
        const batchSize = 1000;
        for (let i = 0; i < filteredData.length; i += batchSize) {
          const batch = filteredData.slice(i, i + batchSize);
          
          // Sanitize batch for generated/derived columns per table
          const ignoreColumns: Record<string, string[]> = {
            grc_risks: ['inherent_risk_score', 'residual_risk_score'],
          };
          const sanitizedBatch = batch.map((row: any) => {
            const copy: any = { ...row, tenant_id: tenantId };
            const cols = ignoreColumns[tableName] || [];
            for (const col of cols) {
              if (col in copy) delete copy[col];
            }
            return copy;
          });
          
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(sanitizedBatch);

          if (insertError) {
            console.error(`[Restore] Error inserting batch to ${tableName}:`, insertError);
            throw insertError;
          }

          rowsRestored += batch.length;
        }

        tablesRestored++;
        console.log(`[Restore] Restored ${filteredData.length} rows to ${tableName}`);

      } catch (tableError) {
        console.error(`[Restore] Error restoring table ${tableName}:`, tableError);
        throw tableError; // Fail fast for data integrity
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Update restore log to completed
    const { error: updateError } = await supabase
      .from('backup_restore_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        tables_restored: tablesRestored,
        rows_restored: rowsRestored,
        updated_at: new Date().toISOString(),
      })
      .eq('id', restoreLogId);

    if (updateError) {
      console.error('[Restore] Failed to update restore log:', updateError);
    }

    console.log(`[Restore] Completed successfully. Duration: ${duration}s, Tables: ${tablesRestored}, Rows: ${rowsRestored}`);

  } catch (error) {
    console.error('[Restore] Fatal error during restore:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update restore log to failed
    await supabase
      .from('backup_restore_logs')
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
      .eq('id', restoreLogId);
  }
}
