/**
 * M18 Part 2: Execute Playbook Edge Function
 * Handles automated playbook execution with step-by-step processing
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playbookId, incidentId, contextData } = await req.json();

    if (!playbookId) {
      throw new Error('playbookId is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Execute-Playbook] Starting execution for playbook:', playbookId);

    // 1. Fetch playbook details
    const { data: playbook, error: playbookError } = await supabase
      .from('soar_playbooks')
      .select('*')
      .eq('id', playbookId)
      .single();

    if (playbookError || !playbook) {
      throw new Error('Playbook not found');
    }

    // 2. Fetch playbook steps
    const { data: steps, error: stepsError } = await supabase
      .from('playbook_steps')
      .select('*')
      .eq('playbook_id', playbookId)
      .order('step_order', { ascending: true });

    if (stepsError) {
      throw new Error('Failed to fetch playbook steps');
    }

    // 3. Create execution record
    const { data: execution, error: execError } = await supabase
      .from('soar_executions')
      .insert({
        tenant_id: playbook.tenant_id,
        playbook_id: playbookId,
        incident_id: incidentId || null,
        status: 'running',
        triggered_by: 'manual',
        execution_context: contextData || {},
        steps_total: steps?.length || 0,
        steps_completed: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (execError || !execution) {
      throw new Error('Failed to create execution record');
    }

    console.log('[Execute-Playbook] Created execution record:', execution.id);

    // 4. Execute steps sequentially
    let currentStep = 0;
    let executionStatus = 'running';

    for (const step of steps || []) {
      currentStep++;

      // Create step log
      const { data: stepLog, error: stepLogError } = await supabase
        .from('execution_step_logs')
        .insert({
          tenant_id: playbook.tenant_id,
          execution_id: execution.id,
          step_id: step.id,
          status: 'running',
          input_data: contextData || {},
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (stepLogError) {
        console.error('[Execute-Playbook] Failed to create step log:', stepLogError);
        continue;
      }

      try {
        // Execute step based on type
        const stepResult = await executeStep(step, contextData, supabase);

        // Update step log with result
        await supabase
          .from('execution_step_logs')
          .update({
            status: 'completed',
            output_data: stepResult,
            completed_at: new Date().toISOString(),
            duration_seconds: Math.floor(
              (new Date().getTime() - new Date(stepLog.started_at).getTime()) / 1000
            ),
          })
          .eq('id', stepLog.id);

        console.log(`[Execute-Playbook] Step ${currentStep} completed successfully`);
      } catch (stepError: any) {
        // Update step log with error
        await supabase
          .from('execution_step_logs')
          .update({
            status: 'failed',
            error_message: stepError.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', stepLog.id);

        console.error(`[Execute-Playbook] Step ${currentStep} failed:`, stepError);

        // If step is critical, stop execution
        if (step.is_critical) {
          executionStatus = 'failed';
          break;
        }
      }

      // Update execution progress
      await supabase
        .from('soar_executions')
        .update({
          steps_completed: currentStep,
          current_step_id: step.id,
        })
        .eq('id', execution.id);
    }

    // 5. Update final execution status
    const finalStatus = executionStatus === 'running' ? 'completed' : executionStatus;
    await supabase
      .from('soar_executions')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id);

    // 6. Update playbook statistics
    await supabase
      .from('soar_playbooks')
      .update({
        execution_count: (playbook.execution_count || 0) + 1,
        last_executed_at: new Date().toISOString(),
      })
      .eq('id', playbookId);

    console.log('[Execute-Playbook] Execution completed:', finalStatus);

    return new Response(
      JSON.stringify({
        success: true,
        execution_id: execution.id,
        status: finalStatus,
        steps_completed: currentStep,
        steps_total: steps?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[Execute-Playbook] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Execute individual playbook step
 */
async function executeStep(
  step: any,
  contextData: any,
  supabase: any
): Promise<any> {
  const { step_type, action_config } = step;

  switch (step_type) {
    case 'action':
      return await executeAction(action_config, contextData, supabase);
    
    case 'decision':
      return await evaluateDecision(action_config, contextData);
    
    case 'notification':
      return await sendNotification(action_config, contextData, supabase);
    
    case 'wait':
      return await waitStep(action_config);
    
    case 'integration':
      return await executeIntegration(action_config, contextData, supabase);
    
    case 'approval':
      return await requestApproval(action_config, contextData, supabase);
    
    default:
      throw new Error(`Unknown step type: ${step_type}`);
  }
}

/**
 * Execute action step
 */
async function executeAction(config: any, context: any, supabase: any): Promise<any> {
  console.log('[Execute-Action] Config:', config);
  
  // Placeholder for action execution logic
  // This would interface with various systems based on action_config
  
  return {
    success: true,
    result: 'Action executed successfully',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Evaluate decision step
 */
async function evaluateDecision(config: any, context: any): Promise<any> {
  console.log('[Evaluate-Decision] Config:', config);
  
  // Placeholder for decision evaluation logic
  // This would evaluate conditions based on context data
  
  return {
    decision: 'proceed',
    reason: 'Conditions met',
  };
}

/**
 * Send notification step
 */
async function sendNotification(config: any, context: any, supabase: any): Promise<any> {
  console.log('[Send-Notification] Config:', config);
  
  // Placeholder for notification logic
  // This would send notifications via configured channels
  
  return {
    sent: true,
    channel: 'email',
    recipients: config.recipients || [],
  };
}

/**
 * Wait step
 */
async function waitStep(config: any): Promise<any> {
  const waitSeconds = config.duration_seconds || 0;
  console.log(`[Wait-Step] Waiting for ${waitSeconds} seconds`);
  
  await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
  
  return {
    waited_seconds: waitSeconds,
  };
}

/**
 * Execute integration step
 */
async function executeIntegration(config: any, context: any, supabase: any): Promise<any> {
  console.log('[Execute-Integration] Config:', config);
  
  // Placeholder for integration execution
  // This would call external systems via configured integrations
  
  return {
    success: true,
    integration_type: config.integration_type,
    response: 'Integration executed',
  };
}

/**
 * Request approval step
 */
async function requestApproval(config: any, context: any, supabase: any): Promise<any> {
  console.log('[Request-Approval] Config:', config);
  
  // Placeholder for approval request logic
  // This would create approval requests and wait for response
  
  return {
    approval_requested: true,
    approver: config.approver_role,
    status: 'pending',
  };
}
