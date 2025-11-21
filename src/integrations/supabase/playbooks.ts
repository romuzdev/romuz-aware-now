/**
 * M18 Part 2: Playbooks & SOAR Integration Layer
 */

import { supabase } from './client';
import type { Database } from './types';

type Playbook = Database['public']['Tables']['soar_playbooks']['Row'];
type PlaybookInsert = Database['public']['Tables']['soar_playbooks']['Insert'];
type PlaybookUpdate = Database['public']['Tables']['soar_playbooks']['Update'];

type PlaybookStep = Database['public']['Tables']['playbook_steps']['Row'];
type PlaybookStepInsert = Database['public']['Tables']['playbook_steps']['Insert'];

type PlaybookExecution = Database['public']['Tables']['soar_executions']['Row'];
type ExecutionStepLog = Database['public']['Tables']['execution_step_logs']['Row'];

type PlaybookTrigger = Database['public']['Tables']['playbook_triggers']['Row'];
type PlaybookTriggerInsert = Database['public']['Tables']['playbook_triggers']['Insert'];

type IntegrationAction = Database['public']['Tables']['integration_actions']['Row'];

/**
 * Fetch all playbooks for the tenant
 */
export async function fetchPlaybooks(tenantId: string) {
  const { data, error } = await supabase
    .from('soar_playbooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Playbook[];
}

/**
 * Fetch playbook by ID with steps
 */
export async function fetchPlaybookWithSteps(playbookId: string) {
  const { data: playbook, error: playbookError } = await supabase
    .from('soar_playbooks')
    .select('*')
    .eq('id', playbookId)
    .single();

  if (playbookError) throw playbookError;

  const { data: steps, error: stepsError } = await supabase
    .from('playbook_steps')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('step_order', { ascending: true });

  if (stepsError) throw stepsError;

  return {
    playbook: playbook as Playbook,
    steps: steps as PlaybookStep[]
  };
}

/**
 * Create new playbook
 */
export async function createPlaybook(playbook: PlaybookInsert) {
  const { data, error } = await supabase
    .from('soar_playbooks')
    .insert(playbook)
    .select()
    .single();

  if (error) throw error;
  return data as Playbook;
}

/**
 * Update playbook
 */
export async function updatePlaybook(id: string, updates: PlaybookUpdate) {
  const { data, error } = await supabase
    .from('soar_playbooks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Playbook;
}

/**
 * Delete playbook
 */
export async function deletePlaybook(id: string) {
  const { error } = await supabase
    .from('soar_playbooks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Create playbook step
 */
export async function createPlaybookStep(step: PlaybookStepInsert) {
  const { data, error } = await supabase
    .from('playbook_steps')
    .insert(step)
    .select()
    .single();

  if (error) throw error;
  return data as PlaybookStep;
}

/**
 * Update playbook step
 */
export async function updatePlaybookStep(id: string, updates: Partial<PlaybookStepInsert>) {
  const { data, error } = await supabase
    .from('playbook_steps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as PlaybookStep;
}

/**
 * Delete playbook step
 */
export async function deletePlaybookStep(id: string) {
  const { error } = await supabase
    .from('playbook_steps')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Fetch playbook executions
 */
export async function fetchPlaybookExecutions(playbookId: string) {
  const { data, error } = await supabase
    .from('soar_executions')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data as PlaybookExecution[];
}

/**
 * Fetch execution step logs
 */
export async function fetchExecutionStepLogs(executionId: string) {
  const { data, error } = await supabase
    .from('execution_step_logs')
    .select(`
      *,
      step:playbook_steps(*)
    `)
    .eq('execution_id', executionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as (ExecutionStepLog & { step: PlaybookStep })[];
}

/**
 * Fetch playbook triggers
 */
export async function fetchPlaybookTriggers(playbookId: string) {
  const { data, error } = await supabase
    .from('playbook_triggers')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as PlaybookTrigger[];
}

/**
 * Create playbook trigger
 */
export async function createPlaybookTrigger(trigger: PlaybookTriggerInsert) {
  const { data, error } = await supabase
    .from('playbook_triggers')
    .insert(trigger)
    .select()
    .single();

  if (error) throw error;
  return data as PlaybookTrigger;
}

/**
 * Update playbook trigger
 */
export async function updatePlaybookTrigger(id: string, updates: Partial<PlaybookTriggerInsert>) {
  const { data, error } = await supabase
    .from('playbook_triggers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as PlaybookTrigger;
}

/**
 * Delete playbook trigger
 */
export async function deletePlaybookTrigger(id: string) {
  const { error } = await supabase
    .from('playbook_triggers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Fetch integration actions
 */
export async function fetchIntegrationActions(tenantId: string) {
  const { data, error } = await supabase
    .from('integration_actions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('action_category', { ascending: true });

  if (error) throw error;
  return data as IntegrationAction[];
}

/**
 * Fetch playbook templates
 */
export async function fetchPlaybookTemplates(tenantId: string) {
  const { data, error } = await supabase
    .from('soar_playbooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_template', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Playbook[];
}

/**
 * Calculate playbook success rate
 */
export async function calculatePlaybookSuccessRate(playbookId: string) {
  const { data, error } = await supabase
    .rpc('calculate_playbook_success_rate', { p_playbook_id: playbookId });

  if (error) throw error;
  return data as number;
}
