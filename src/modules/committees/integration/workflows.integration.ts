/**
 * D4 Enhancement: Committee Workflows Integration Layer
 * CRUD operations for committee workflows and stages
 */

import { supabase } from '@/integrations/supabase/client';
import { logAuditAction } from '@/core/services/audit';

/**
 * Get current tenant ID
 */
async function getCurrentTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  return data?.tenant_id || null;
}

/**
 * Get current user ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// ============================================================================
// WORKFLOWS
// ============================================================================

/**
 * Fetch all workflows for a committee
 */
export async function fetchWorkflows(committeeId: string) {
  const { data, error } = await supabase
    .from('committee_workflows')
    .select(`
      *,
      committee:committees(name, code),
      stages:committee_workflow_stages(count)
    `)
    .eq('committee_id', committeeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch single workflow by ID with stages
 */
export async function fetchWorkflowById(id: string) {
  const { data, error } = await supabase
    .from('committee_workflows')
    .select(`
      *,
      committee:committees(name, code),
      stages:committee_workflow_stages(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all workflows for current tenant
 */
export async function fetchAllWorkflows(filters?: {
  state?: string;
  workflow_type?: string;
  committee_id?: string;
}) {
  let query = supabase
    .from('committee_workflows')
    .select(`
      *,
      committee:committees(name, code)
    `)
    .order('created_at', { ascending: false });

  if (filters?.state) {
    query = query.eq('state', filters.state);
  }
  if (filters?.workflow_type) {
    query = query.eq('workflow_type', filters.workflow_type);
  }
  if (filters?.committee_id) {
    query = query.eq('committee_id', filters.committee_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Create new workflow
 */
export async function createWorkflow(workflow: any) {
  const tenantId = await getCurrentTenantId();
  const userId = await getCurrentUserId();

  if (!tenantId) throw new Error('No tenant context');
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('committee_workflows')
    .insert({
      ...workflow,
      tenant_id: tenantId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAuditAction({
    entityType: 'committee_workflow',
    entityId: data.id,
    action: 'create',
    payload: { workflow_type: workflow.workflow_type, title: workflow.title },
  });

  return data;
}

/**
 * Update workflow
 */
export async function updateWorkflow(id: string, updates: any) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('committee_workflows')
    .update({
      ...updates,
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAuditAction({
    entityType: 'committee_workflow',
    entityId: id,
    action: 'update',
    payload: updates,
  });

  return data;
}

/**
 * Delete workflow
 */
export async function deleteWorkflow(id: string) {
  const { error } = await supabase
    .from('committee_workflows')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Log audit
  await logAuditAction({
    entityType: 'committee_workflow',
    entityId: id,
    action: 'delete',
  });
}

/**
 * Start workflow (transition from draft to in_progress)
 */
export async function startWorkflow(id: string) {
  const updates = {
    state: 'in_progress',
    started_at: new Date().toISOString(),
  };

  return updateWorkflow(id, updates);
}

/**
 * Complete workflow
 */
export async function completeWorkflow(id: string) {
  const updates = {
    state: 'completed',
    completed_at: new Date().toISOString(),
  };

  return updateWorkflow(id, updates);
}

/**
 * Cancel workflow
 */
export async function cancelWorkflow(id: string, reason?: string) {
  const updates = {
    state: 'cancelled',
    cancelled_at: new Date().toISOString(),
    metadata: { cancellation_reason: reason },
  };

  return updateWorkflow(id, updates);
}

// ============================================================================
// WORKFLOW STAGES
// ============================================================================

/**
 * Fetch stages for a workflow
 */
export async function fetchWorkflowStages(workflowId: string) {
  const { data, error } = await supabase
    .from('committee_workflow_stages')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('stage_order');

  if (error) throw error;
  return data;
}

/**
 * Create workflow stage
 */
export async function createWorkflowStage(stage: any) {
  const { data, error } = await supabase
    .from('committee_workflow_stages')
    .insert(stage)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update workflow stage
 */
export async function updateWorkflowStage(id: string, updates: any) {
  const { data, error } = await supabase
    .from('committee_workflow_stages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete workflow stage
 */
export async function deleteWorkflowStage(id: string) {
  const { error } = await supabase
    .from('committee_workflow_stages')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Complete workflow stage
 */
export async function completeWorkflowStage(id: string, notes?: string) {
  const updates = {
    state: 'completed',
    completed_at: new Date().toISOString(),
    notes,
  };

  return updateWorkflowStage(id, updates);
}

/**
 * Advance workflow to next stage
 */
export async function advanceWorkflow(workflowId: string) {
  // Get current workflow
  const workflow = await fetchWorkflowById(workflowId);
  const stages = workflow.stages || [];

  // Find current stage
  const currentStageIndex = stages.findIndex(
    (s: any) => s.id === workflow.current_stage_id
  );

  // Get next stage
  const nextStage = stages[currentStageIndex + 1];

  if (!nextStage) {
    // No more stages, complete workflow
    return completeWorkflow(workflowId);
  }

  // Update current stage to completed
  if (workflow.current_stage_id) {
    await completeWorkflowStage(workflow.current_stage_id);
  }

  // Update workflow to next stage
  return updateWorkflow(workflowId, {
    current_stage_id: nextStage.id,
  });
}
