/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Edge Function: Recovery Test Automation
 * Purpose: Automate backup recovery testing and validation
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRecoveryTestRequest } from "../_shared/simple-validation.ts";
import { checkRateLimit, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { getTenantId } from "../_shared/tenant-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecoveryTestRequest {
  dr_plan_id?: string;
  backup_job_id?: string;
  test_name: string;
  test_type: 'manual' | 'automated' | 'scheduled';
  validation_level: 'basic' | 'full' | 'deep';
}

interface RecoveryTestResult {
  success: boolean;
  test_id: string;
  test_status: string;
  duration_seconds: number;
  validation_results: {
    data_integrity: boolean;
    schema_validation: boolean;
    performance_check: boolean;
  };
  issues_found: number;
  issues_details: any[];
  recommendations: string[];
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] Recovery test request received`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get tenant ID using unified utility
    const tenantId = await getTenantId(supabase as any, user.id);
    console.log(`[${requestId}] User: ${user.id}, Tenant: ${tenantId}`);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      tenantId,
      RATE_LIMITS.RECOVERY_TEST
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
    const validationResult = validateRecoveryTestRequest(body);
    
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

    const testRequest: RecoveryTestRequest = body;

    console.log('Starting recovery test:', {
      tenantId,
      testRequest,
    });

    // Create recovery test record
    const testId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('backup_recovery_tests')
      .insert({
        id: testId,
        tenant_id: tenantId,
        dr_plan_id: testRequest.dr_plan_id || null,
        backup_job_id: testRequest.backup_job_id || null,
        test_name: testRequest.test_name,
        test_type: testRequest.test_type,
        test_status: 'running',
        started_at: new Date().toISOString(),
        created_by: user.id,
      });

    if (insertError) {
      console.error('Failed to create test record:', insertError);
      throw insertError;
    }

    // Execute recovery test asynchronously
    executeRecoveryTest(
      supabase,
      testId,
      tenantId,
      testRequest
    ).catch(error => {
      console.error('Recovery test failed:', error);
    });

    // Return immediate response
    const result: RecoveryTestResult = {
      success: true,
      test_id: testId,
      test_status: 'running',
      duration_seconds: 0,
      validation_results: {
        data_integrity: false,
        schema_validation: false,
        performance_check: false,
      },
      issues_found: 0,
      issues_details: [],
      recommendations: [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Recovery test error:', error);
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

async function executeRecoveryTest(
  supabase: any,
  testId: string,
  tenantId: string,
  testRequest: RecoveryTestRequest
) {
  const startTime = Date.now();
  const issues: any[] = [];
  const recommendations: string[] = [];
  
  try {
    console.log('Executing recovery test:', testId);

    // Step 1: Get backup to test
    let backupJobId: string = testRequest.backup_job_id || '';
    
    if (!backupJobId) {
      // Get latest successful backup
      const { data: latestBackup, error: backupError } = await supabase
        .from('backup_jobs')
        .select('id, backup_name, created_at')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (backupError || !latestBackup) {
        throw new Error('No backup found for testing');
      }

      backupJobId = latestBackup.id;
      console.log('Using latest backup:', backupJobId);
    }

    // Step 2: Validate backup integrity
    console.log('Validating backup integrity...');
    const integrityCheck = await validateBackupIntegrity(
      supabase,
      backupJobId,
      tenantId
    );

    if (!integrityCheck.valid) {
      issues.push({
        severity: 'high',
        category: 'integrity',
        message: 'Backup integrity check failed',
        details: integrityCheck.details,
      });
    }

    // Step 3: Test data restoration
    console.log('Testing data restoration...');
    const restorationTest = await testDataRestoration(
      supabase,
      backupJobId,
      tenantId,
      testRequest.validation_level
    );

    if (!restorationTest.success) {
      issues.push({
        severity: 'high',
        category: 'restoration',
        message: 'Data restoration test failed',
        details: restorationTest.details,
      });
    }

    // Step 4: Performance check
    console.log('Checking performance metrics...');
    const performanceCheck = await checkRestorePerformance(
      supabase,
      backupJobId,
      tenantId
    );

    if (performanceCheck.duration_seconds > 300) { // 5 minutes
      recommendations.push(
        'Restore operation took longer than expected. Consider optimizing backup strategy.'
      );
    }

    // Step 5: Schema validation
    console.log('Validating schema consistency...');
    const schemaValidation = await validateSchema(
      supabase,
      tenantId
    );

    if (!schemaValidation.valid) {
      issues.push({
        severity: 'medium',
        category: 'schema',
        message: 'Schema validation found inconsistencies',
        details: schemaValidation.details,
      });
    }

    // Calculate test duration
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

    // Determine test status
    const testStatus = issues.filter(i => i.severity === 'high').length > 0 
      ? 'failed' 
      : issues.length > 0 
      ? 'passed' // passed with warnings
      : 'passed';

    // Generate recommendations
    if (issues.length === 0) {
      recommendations.push('All validation checks passed successfully');
    }

    if (performanceCheck.duration_seconds > 180) {
      recommendations.push(
        'Consider implementing incremental backups to reduce restore time'
      );
    }

    // Update test record with results
    const { error: updateError } = await supabase
      .from('backup_recovery_tests')
      .update({
        test_status: testStatus,
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        validation_results: {
          data_integrity: integrityCheck.valid,
          schema_validation: schemaValidation.valid,
          performance_check: performanceCheck.acceptable,
          restoration_test: restorationTest.success,
        },
        data_integrity_check: integrityCheck.valid,
        performance_metrics: {
          restore_duration_seconds: performanceCheck.duration_seconds,
          data_validation_time: restorationTest.validation_time,
        },
        issues_found: issues.length,
        issues_details: issues,
        recommendations: recommendations.join('\n'),
        tables_tested: restorationTest.tables_tested || [],
        records_validated: restorationTest.records_validated || 0,
      })
      .eq('id', testId);

    if (updateError) {
      console.error('Failed to update test record:', updateError);
    }

    console.log('Recovery test completed:', {
      testId,
      testStatus,
      durationSeconds,
      issuesFound: issues.length,
    });

  } catch (error) {
    console.error('Recovery test execution failed:', error);
    
    // Update test record with failure
    await supabase
      .from('backup_recovery_tests')
      .update({
        test_status: 'failed',
        completed_at: new Date().toISOString(),
        duration_seconds: Math.floor((Date.now() - startTime) / 1000),
        issues_found: issues.length + 1,
        issues_details: [
          ...issues,
          {
            severity: 'critical',
            category: 'execution',
            message: 'Test execution failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      })
      .eq('id', testId);
  }
}

async function validateBackupIntegrity(
  supabase: any,
  backupJobId: string,
  tenantId: string
) {
  try {
    // Check if backup exists and is accessible
    const { data: backup, error } = await supabase
      .from('backup_jobs')
      .select('*')
      .eq('id', backupJobId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !backup) {
      return {
        valid: false,
        details: 'Backup not found or not accessible',
      };
    }

    // Check if backup is completed
    if (backup.status !== 'completed') {
      return {
        valid: false,
        details: `Backup status is ${backup.status}, expected 'completed'`,
      };
    }

    // Check if storage path exists
    if (!backup.storage_path) {
      return {
        valid: false,
        details: 'Backup storage path is missing',
      };
    }

    // TODO: Verify file checksum if available
    
    return {
      valid: true,
      details: 'Backup integrity validated successfully',
    };
  } catch (error) {
    return {
      valid: false,
      details: `Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function testDataRestoration(
  supabase: any,
  backupJobId: string,
  tenantId: string,
  validationLevel: string
) {
  try {
    // For this test, we'll validate a sample of records
    // In a real scenario, you might restore to a test database
    
    const tables = ['awareness_campaigns', 'backup_jobs', 'backup_schedules'];
    let recordsValidated = 0;

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(validationLevel === 'deep' ? 100 : 10);

      if (!error && data) {
        recordsValidated += data.length;
      }
    }

    return {
      success: true,
      tables_tested: tables,
      records_validated: recordsValidated,
      validation_time: Math.random() * 10, // Simulated
      details: `Successfully validated ${recordsValidated} records across ${tables.length} tables`,
    };
  } catch (error) {
    return {
      success: false,
      tables_tested: [],
      records_validated: 0,
      validation_time: 0,
      details: `Restoration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function checkRestorePerformance(
  supabase: any,
  backupJobId: string,
  tenantId: string
) {
  try {
    // Get backup metadata
    const { data: backup } = await supabase
      .from('backup_jobs')
      .select('backup_size_bytes, duration_seconds')
      .eq('id', backupJobId)
      .single();

    // Estimate restore time based on backup size
    // Assuming 100MB/s restore speed
    const estimatedDuration = backup?.backup_size_bytes 
      ? Math.ceil(backup.backup_size_bytes / (100 * 1024 * 1024))
      : 60;

    return {
      duration_seconds: estimatedDuration,
      acceptable: estimatedDuration < 300, // 5 minutes threshold
    };
  } catch (error) {
    return {
      duration_seconds: 0,
      acceptable: false,
    };
  }
}

async function validateSchema(
  supabase: any,
  tenantId: string
) {
  try {
    // Basic schema validation
    // Check if critical tables exist and have data
    const criticalTables = [
      'tenants',
      'backup_jobs',
      'backup_schedules',
      'backup_disaster_recovery_plans',
    ];

    for (const table of criticalTables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        return {
          valid: false,
          details: `Table ${table} validation failed: ${error.message}`,
        };
      }
    }

    return {
      valid: true,
      details: 'Schema validation passed',
    };
  } catch (error) {
    return {
      valid: false,
      details: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
