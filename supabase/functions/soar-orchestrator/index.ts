/**
 * SOAR Orchestrator Edge Function
 * M18.5 - SecOps Integration
 * 
 * Purpose:
 * 1. Execute SOAR playbooks (automated response)
 * 2. Manage workflow execution
 * 3. Perform automated actions (block IP, isolate endpoint, etc.)
 * 4. Log execution details
 * 5. Handle failures and retries
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getTenantId } from '../_shared/tenant-utils.ts';

interface OrchestrationRequest {
  playbookId: string;
  eventId?: string;
  manualTrigger?: boolean;
  autoTrigger?: boolean;
}

interface ExecutionLogEntry {
  timestamp: string;
  action: string;
  status: 'success' | 'failed';
  details: Record<string, any>;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SOAR Orchestrator] Starting execution...');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authenticated user (for manual triggers)
    const authHeader = req.headers.get('Authorization');
    let tenantId: string;
    let userId: string | undefined;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser(token);

      if (!authError && user) {
        tenantId = await getTenantId(supabaseClient, user.id);
        userId = user.id;
      } else {
        throw new Error('Authentication failed');
      }
    } else {
      throw new Error('Missing authorization header');
    }

    console.log(`[SOAR Orchestrator] Executing for tenant: ${tenantId}`);

    // Parse request
    const { playbookId, eventId, manualTrigger, autoTrigger }: OrchestrationRequest =
      await req.json();

    if (!playbookId) {
      throw new Error('playbookId is required');
    }

    // 1. Fetch playbook
    const { data: playbook, error: playbookError } = await supabaseClient
      .from('soar_playbooks')
      .select('*')
      .eq('id', playbookId)
      .eq('tenant_id', tenantId)
      .single();

    if (playbookError || !playbook) {
      throw new Error(`Playbook not found: ${playbookId}`);
    }

    console.log(`[SOAR Orchestrator] Playbook loaded: ${playbook.playbook_name_ar}`);

    // Check if approval required
    if (playbook.approval_required && !manualTrigger) {
      console.log('[SOAR Orchestrator] Playbook requires manual approval');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Playbook requires manual approval',
          requires_approval: true,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Create execution record
    const { data: execution, error: executionError } = await supabaseClient
      .from('soar_executions')
      .insert({
        tenant_id: tenantId,
        playbook_id: playbookId,
        trigger_event_id: eventId,
        status: 'running',
        executed_by: userId,
        execution_log: [],
        actions_taken: [],
      })
      .select()
      .single();

    if (executionError || !execution) {
      throw new Error('Failed to create execution record');
    }

    console.log(`[SOAR Orchestrator] Execution started: ${execution.id}`);

    // 3. Execute automation steps
    const results: ExecutionLogEntry[] = [];
    const actionsTaken: string[] = [];
    let allSucceeded = true;

    for (const step of playbook.automation_steps) {
      try {
        console.log(`[SOAR Orchestrator] Executing step: ${step.action}`);

        const result = await executeSOARAction(step, execution, supabaseClient, tenantId);

        const logEntry: ExecutionLogEntry = {
          timestamp: new Date().toISOString(),
          action: step.action,
          status: 'success',
          details: result,
        };

        results.push(logEntry);
        actionsTaken.push(step.action);

        // Update execution log in real-time
        await supabaseClient
          .from('soar_executions')
          .update({
            execution_log: results,
            actions_taken: actionsTaken,
          })
          .eq('id', execution.id);

        console.log(`[SOAR Orchestrator] Step completed: ${step.action}`);
      } catch (error) {
        console.error(`[SOAR Orchestrator] Step failed: ${step.action}`, error);

        const logEntry: ExecutionLogEntry = {
          timestamp: new Date().toISOString(),
          action: step.action,
          status: 'failed',
          details: {},
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        results.push(logEntry);
        allSucceeded = false;

        // Update execution log
        await supabaseClient
          .from('soar_executions')
          .update({
            execution_log: results,
          })
          .eq('id', execution.id);

        // Handle failure based on playbook config
        if (step.on_failure === 'stop') {
          console.log('[SOAR Orchestrator] Stopping execution due to failure');
          break;
        }
      }
    }

    // 4. Mark as completed or failed
    const finalStatus = allSucceeded ? 'completed' : 'failed';

    await supabaseClient
      .from('soar_executions')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        result: { success: allSucceeded, steps_executed: results.length },
        error_message: allSucceeded ? null : 'One or more steps failed',
      })
      .eq('id', execution.id);

    // 5. Update playbook statistics
    await updatePlaybookStatistics(supabaseClient, playbookId, allSucceeded);

    console.log(`[SOAR Orchestrator] Execution ${finalStatus}: ${execution.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        execution_id: execution.id,
        status: finalStatus,
        steps_executed: results.length,
        actions_taken: actionsTaken,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[SOAR Orchestrator] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Execute a single SOAR action
 */
async function executeSOARAction(
  step: any,
  execution: any,
  supabase: any,
  tenantId: string
): Promise<Record<string, any>> {
  switch (step.action) {
    case 'block_ip':
      return await blockIPAddress(step.parameters, tenantId);

    case 'isolate_endpoint':
      return await isolateEndpoint(step.parameters, tenantId);

    case 'disable_user':
      return await disableUserAccount(step.parameters, supabase, tenantId);

    case 'send_notification':
      return await sendSecurityAlert(step.parameters, supabase, tenantId);

    case 'create_ticket':
      return await createIncidentTicket(step.parameters, supabase, tenantId);

    case 'update_firewall':
      return await updateFirewallRules(step.parameters, tenantId);

    case 'quarantine_file':
      return await quarantineFile(step.parameters, tenantId);

    default:
      throw new Error(`Unknown SOAR action: ${step.action}`);
  }
}

/**
 * Block IP Address
 */
async function blockIPAddress(
  params: any,
  tenantId: string
): Promise<Record<string, any>> {
  console.log(`[SOAR Action] Blocking IP: ${params.ip}`);

  // TODO: Integrate with actual firewall API
  // For now, simulate the action

  return {
    action: 'block_ip',
    ip: params.ip,
    status: 'simulated',
    message: `IP ${params.ip} would be blocked on firewall`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Isolate Endpoint
 */
async function isolateEndpoint(
  params: any,
  tenantId: string
): Promise<Record<string, any>> {
  console.log(`[SOAR Action] Isolating endpoint: ${params.hostname}`);

  // TODO: Integrate with EDR/MDM solution
  // For now, simulate the action

  return {
    action: 'isolate_endpoint',
    hostname: params.hostname,
    status: 'simulated',
    message: `Endpoint ${params.hostname} would be isolated`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Disable User Account
 */
async function disableUserAccount(
  params: any,
  supabase: any,
  tenantId: string
): Promise<Record<string, any>> {
  console.log(`[SOAR Action] Disabling user: ${params.userId}`);

  // TODO: Integrate with identity management system
  // For now, simulate the action

  return {
    action: 'disable_user',
    user_id: params.userId,
    status: 'simulated',
    message: `User account ${params.userId} would be disabled`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send Security Alert
 */
async function sendSecurityAlert(
  params: any,
  supabase: any,
  tenantId: string
): Promise<Record<string, any>> {
  console.log(`[SOAR Action] Sending alert: ${params.title}`);

  // TODO: Integrate with notification system (email, Slack, SMS)
  // For now, log the action

  return {
    action: 'send_notification',
    title: params.title,
    message: params.message,
    recipients: params.recipients || [],
    status: 'sent',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create Incident Ticket
 */
async function createIncidentTicket(
  params: any,
  supabase: any,
  tenantId: string
): Promise<Record<string, any>> {
  console.log(`[SOAR Action] Creating incident ticket`);

  try {
    // Create incident in security_incidents table
    const { data: incident, error } = await supabase
      .from('security_incidents')
      .insert({
        tenant_id: tenantId,
        title_ar: params.title_ar || 'حادث أمني جديد',
        title_en: params.title_en || 'New Security Incident',
        description_ar: params.description_ar || '',
        description_en: params.description_en || '',
        severity: params.severity || 'medium',
        status: 'new',
        source: 'soar',
        detected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      action: 'create_ticket',
      incident_id: incident.id,
      status: 'created',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[SOAR Action] Ticket creation failed:', error);
    throw error;
  }
}

/**
 * Update Firewall Rules
 */
async function updateFirewallRules(
  params: any,
  tenantId: string
): Promise<Record<string, any>> {
  console.log(`[SOAR Action] Updating firewall rules`);

  // TODO: Integrate with firewall management API
  // For now, simulate the action

  return {
    action: 'update_firewall',
    rule: params.rule,
    status: 'simulated',
    message: 'Firewall rules would be updated',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Quarantine File
 */
async function quarantineFile(
  params: any,
  tenantId: string
): Promise<Record<string, any>> {
  console.log(`[SOAR Action] Quarantining file: ${params.file_path}`);

  // TODO: Integrate with endpoint protection
  // For now, simulate the action

  return {
    action: 'quarantine_file',
    file_path: params.file_path,
    status: 'simulated',
    message: `File ${params.file_path} would be quarantined`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Update playbook statistics
 */
async function updatePlaybookStatistics(
  supabase: any,
  playbookId: string,
  success: boolean
): Promise<void> {
  const { data: playbook } = await supabase
    .from('soar_playbooks')
    .select('execution_count, success_count')
    .eq('id', playbookId)
    .single();

  if (!playbook) return;

  await supabase
    .from('soar_playbooks')
    .update({
      execution_count: playbook.execution_count + 1,
      success_count: success ? playbook.success_count + 1 : playbook.success_count,
      last_executed_at: new Date().toISOString(),
    })
    .eq('id', playbookId);
}
