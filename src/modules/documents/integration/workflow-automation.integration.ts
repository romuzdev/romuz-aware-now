/**
 * Document Workflow Automation - Integration Layer
 * 
 * Provides functions for managing workflow rules and executions
 */

import { supabase } from '@/integrations/supabase/client';
import { logAuditAction } from '@/core/services/audit';

export interface WorkflowRule {
  id: string;
  tenant_id: string;
  rule_name: string;
  description: string | null;
  rule_type: 'auto_approval' | 'expiration_alert' | 'auto_tagging' | 'version_alert';
  conditions: any;
  actions: any;
  is_enabled: boolean;
  schedule_config: any | null;
  priority: number;
  execution_order: number;
  app_code: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string | null;
  last_executed_at: string | null;
  execution_count: number;
}

export interface WorkflowExecution {
  id: string;
  tenant_id: string;
  rule_id: string;
  document_id: string;
  execution_status: 'success' | 'failed' | 'skipped' | 'pending';
  execution_started_at: string;
  execution_completed_at: string | null;
  execution_duration_ms: number | null;
  actions_performed: any | null;
  error_message: string | null;
  error_details: any | null;
  trigger_event: string | null;
  metadata: any | null;
  created_at: string;
}

export interface CreateWorkflowRuleInput {
  rule_name: string;
  description?: string;
  rule_type: 'auto_approval' | 'expiration_alert' | 'auto_tagging' | 'version_alert';
  conditions: any;
  actions: any;
  is_enabled?: boolean;
  priority?: number;
  execution_order?: number;
  app_code?: string | null;
}

/**
 * Fetch all workflow rules for a tenant (optionally filtered by app_code)
 */
export async function fetchWorkflowRules(
  tenantId: string,
  appCode?: string | null
): Promise<WorkflowRule[]> {
  let query = supabase
    .from('document_workflow_rules')
    .select('*')
    .eq('tenant_id', tenantId);

  if (appCode) {
    query = query.eq('app_code', appCode);
  }

  const { data, error } = await query
    .order('priority', { ascending: false })
    .order('execution_order', { ascending: true });

  if (error) {
    console.error('Error fetching workflow rules:', error);
    throw new Error(`Failed to fetch workflow rules: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch a single workflow rule by ID
 */
export async function fetchWorkflowRuleById(
  tenantId: string,
  ruleId: string
): Promise<WorkflowRule | null> {
  const { data, error } = await supabase
    .from('document_workflow_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', ruleId)
    .single();

  if (error) {
    console.error('Error fetching workflow rule:', error);
    return null;
  }

  return data;
}

/**
 * Create a new workflow rule
 */
export async function createWorkflowRule(
  tenantId: string,
  userId: string,
  input: CreateWorkflowRuleInput
): Promise<WorkflowRule> {
  const { data, error } = await supabase
    .from('document_workflow_rules')
    .insert({
      tenant_id: tenantId,
      created_by: userId,
      updated_by: userId,
      ...input,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating workflow rule:', error);
    throw new Error(`Failed to create workflow rule: ${error.message}`);
  }

  await logAuditAction({
    entityType: 'workflow_rule',
    entityId: data.id,
    action: 'create',
    payload: { rule_name: input.rule_name, rule_type: input.rule_type },
  });

  return data;
}

/**
 * Update a workflow rule
 */
export async function updateWorkflowRule(
  tenantId: string,
  userId: string,
  ruleId: string,
  updates: Partial<CreateWorkflowRuleInput>
): Promise<WorkflowRule> {
  const { data, error } = await supabase
    .from('document_workflow_rules')
    .update({
      ...updates,
      updated_by: userId,
    })
    .eq('tenant_id', tenantId)
    .eq('id', ruleId)
    .select()
    .single();

  if (error) {
    console.error('Error updating workflow rule:', error);
    throw new Error(`Failed to update workflow rule: ${error.message}`);
  }

  await logAuditAction({
    entityType: 'workflow_rule',
    entityId: ruleId,
    action: 'update',
    payload: updates,
  });

  return data;
}

/**
 * Delete a workflow rule
 */
export async function deleteWorkflowRule(
  tenantId: string,
  userId: string,
  ruleId: string
): Promise<void> {
  const { error } = await supabase
    .from('document_workflow_rules')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', ruleId);

  if (error) {
    console.error('Error deleting workflow rule:', error);
    throw new Error(`Failed to delete workflow rule: ${error.message}`);
  }

  await logAuditAction({
    entityType: 'workflow_rule',
    entityId: ruleId,
    action: 'delete',
  });
}

/**
 * Toggle workflow rule enabled state
 */
export async function toggleWorkflowRule(
  tenantId: string,
  userId: string,
  ruleId: string,
  enabled: boolean
): Promise<WorkflowRule> {
  return updateWorkflowRule(tenantId, userId, ruleId, { is_enabled: enabled });
}

/**
 * Execute a workflow rule on a document
 */
export async function executeWorkflowRule(
  tenantId: string,
  ruleId: string,
  documentId: string
): Promise<any> {
  const { data, error } = await supabase.functions.invoke('document-workflow-automation', {
    body: {
      action: 'execute_rule',
      rule_id: ruleId,
      document_id: documentId,
      tenant_id: tenantId,
    },
  });

  if (error) {
    console.error('Error executing workflow rule:', error);
    throw new Error(`Failed to execute workflow rule: ${error.message}`);
  }

  return data;
}

/**
 * Check document expirations
 */
export async function checkDocumentExpirations(tenantId: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke('document-workflow-automation', {
    body: {
      action: 'check_expirations',
      tenant_id: tenantId,
    },
  });

  if (error) {
    console.error('Error checking expirations:', error);
    throw new Error(`Failed to check expirations: ${error.message}`);
  }

  return data;
}

/**
 * Get AI-powered tag suggestions for a document
 */
export async function suggestDocumentTags(
  tenantId: string,
  documentId: string
): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('document-workflow-automation', {
    body: {
      action: 'suggest_tags',
      document_id: documentId,
      tenant_id: tenantId,
    },
  });

  if (error) {
    console.error('Error suggesting tags:', error);
    throw new Error(`Failed to suggest tags: ${error.message}`);
  }

  return data?.suggested_tags || [];
}

/**
 * Compare two document versions
 */
export async function compareDocumentVersions(
  tenantId: string,
  versionId1: string,
  versionId2: string
): Promise<any> {
  const { data, error } = await supabase.functions.invoke('document-workflow-automation', {
    body: {
      action: 'compare_versions',
      version_ids: [versionId1, versionId2],
      tenant_id: tenantId,
    },
  });

  if (error) {
    console.error('Error comparing versions:', error);
    throw new Error(`Failed to compare versions: ${error.message}`);
  }

  return data;
}

/**
 * Fetch workflow executions for a document
 */
export async function fetchWorkflowExecutions(
  tenantId: string,
  documentId?: string,
  ruleId?: string,
  limit: number = 50
): Promise<WorkflowExecution[]> {
  let query = supabase
    .from('document_workflow_executions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (documentId) {
    query = query.eq('document_id', documentId);
  }

  if (ruleId) {
    query = query.eq('rule_id', ruleId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching workflow executions:', error);
    throw new Error(`Failed to fetch workflow executions: ${error.message}`);
  }

  return data || [];
}

/**
 * Get workflow execution statistics
 */
export async function getWorkflowStatistics(
  tenantId: string,
  ruleId?: string
): Promise<any> {
  let query = supabase
    .from('document_workflow_executions')
    .select('execution_status, execution_duration_ms')
    .eq('tenant_id', tenantId);

  if (ruleId) {
    query = query.eq('rule_id', ruleId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching statistics:', error);
    throw new Error(`Failed to fetch statistics: ${error.message}`);
  }

  const stats = {
    total: data?.length || 0,
    success: data?.filter(e => e.execution_status === 'success').length || 0,
    failed: data?.filter(e => e.execution_status === 'failed').length || 0,
    skipped: data?.filter(e => e.execution_status === 'skipped').length || 0,
    avg_duration_ms: 0,
  };

  const durations = data
    ?.filter(e => e.execution_duration_ms !== null)
    .map(e => e.execution_duration_ms) || [];

  if (durations.length > 0) {
    stats.avg_duration_ms = Math.round(
      durations.reduce((a, b) => a + b, 0) / durations.length
    );
  }

  return stats;
}
