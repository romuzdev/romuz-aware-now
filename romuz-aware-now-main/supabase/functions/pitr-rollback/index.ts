/**
 * ============================================================================
 * M23 - PITR Rollback Edge Function
 * Purpose: Execute rollback from pre-restore snapshot
 * Security: Rate-limited, tenant-scoped, with audit logging
 * ============================================================================
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, type RateLimitConfig } from '../_shared/rate-limiter.ts';
import { getTenantId } from '../_shared/tenant-utils.ts';
import { validateRollbackRequest } from '../_shared/simple-validation.ts';

// Types
interface RollbackRequest {
  snapshotId: string;
  reason?: string;
  confirmRollback: boolean;
  dryRun?: boolean;
}

interface RollbackResult {
  success: boolean;
  rollbackId?: string;
  affectedTables?: string[];
  rowsRestored?: number;
  error?: string;
  warnings?: string[];
}

// Rate limit configuration for rollback
const ROLLBACK_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,            // 5 rollbacks per hour
  keyPrefix: 'pitr_rollback'
};

/**
 * Main handler
 */
Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get tenant and user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantId = await getTenantId(supabase as any, authHeader);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(tenantId, ROLLBACK_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter,
          remaining: rateLimitResult.remaining
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetAt)
          } 
        }
      );
    }

    // Parse and validate request
    const body: RollbackRequest = await req.json();
    const validation = validateRollbackRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PITR-Rollback] Request:', { 
      snapshotId: body.snapshotId,
      dryRun: body.dryRun,
      tenantId 
    });

    // Execute rollback
    const result = await executeRollback(
      supabase,
      tenantId,
      body,
      user.id
    );

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[PITR-Rollback] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Execute PITR rollback
 */
async function executeRollback(
  supabase: SupabaseClient,
  tenantId: string,
  request: RollbackRequest,
  userId: string
): Promise<RollbackResult> {
  // Validate snapshot exists and is rollback-eligible
  const { data: snapshot, error: snapshotError } = await supabase
    .from('backup_pitr_snapshots')
    .select('*')
    .eq('id', request.snapshotId)
    .eq('tenant_id', tenantId)
    .eq('is_rolled_back', false)
    .eq('status', 'active')
    .single();

  if (snapshotError || !snapshot) {
    return {
      success: false,
      error: 'Snapshot not found or not eligible for rollback'
    };
  }

  // Dry run: preview rollback
  if (request.dryRun) {
    return {
      success: true,
      affectedTables: snapshot.affected_tables || [],
      rowsRestored: snapshot.total_rows_count || 0,
      warnings: [
        'This is a dry run. No data will be modified.',
        `Rollback will affect ${snapshot.affected_tables?.length || 0} tables`,
        `Estimated rows to restore: ${snapshot.total_rows_count || 0}`
      ]
    };
  }

  // Confirm rollback
  if (!request.confirmRollback) {
    return {
      success: false,
      error: 'Rollback confirmation required. Set confirmRollback: true'
    };
  }

  // Execute rollback via database function
  const { data: rollbackData, error: rollbackError } = await supabase
    .rpc('execute_pitr_rollback', {
      p_snapshot_id: request.snapshotId,
      p_initiated_by: userId,
      p_reason: request.reason || 'Manual rollback via API'
    });

  if (rollbackError) {
    return {
      success: false,
      error: `Rollback failed: ${rollbackError.message}`
    };
  }

  // TODO: Actually restore data from snapshot_data
  // For now, we mark as rolled back but don't restore data
  // Full implementation would:
  // 1. Parse snapshot_data (jsonb)
  // 2. For each affected table, restore rows
  // 3. Handle FK constraints
  // 4. Update rollback_history with completion status

  return {
    success: true,
    rollbackId: rollbackData,
    affectedTables: snapshot.affected_tables || [],
    rowsRestored: 0, // TODO: Implement actual restoration
    warnings: [
      '⚠️ Rollback initiated but data restoration not yet implemented',
      'Snapshot marked as rolled back',
      'Full data restoration requires table-specific logic'
    ]
  };
}
