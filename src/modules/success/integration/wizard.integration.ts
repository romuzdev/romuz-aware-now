/**
 * M25 - Setup Wizard Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { SetupWizardState } from '../types';

/**
 * Get current wizard state for tenant
 */
export async function getWizardState(
  wizardType: 'initial_setup' | 'module_setup' = 'initial_setup'
): Promise<SetupWizardState | null> {
  const { data, error } = await supabase
    .from('success_wizard_states')
    .select('*')
    .eq('wizard_type', wizardType)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Initialize wizard for tenant
 */
export async function initializeWizard(params: {
  wizard_type: 'initial_setup' | 'module_setup';
  current_step: string;
  total_steps: number;
  wizard_data?: Record<string, any>;
}): Promise<SetupWizardState> {
  const { data, error } = await supabase
    .from('success_wizard_states')
    .insert({
      wizard_type: params.wizard_type,
      current_step: params.current_step,
      total_steps: params.total_steps,
      wizard_data: params.wizard_data || {},
      completed_steps: [],
      completion_pct: 0,
      is_completed: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update wizard progress
 */
export async function updateWizardProgress(params: {
  wizard_type: 'initial_setup' | 'module_setup';
  current_step: string;
  completed_steps: string[];
  wizard_data?: Record<string, any>;
}): Promise<SetupWizardState> {
  // Calculate completion percentage
  const state = await getWizardState(params.wizard_type);
  if (!state) throw new Error('Wizard state not found');
  
  const completion_pct = Math.round(
    (params.completed_steps.length / state.total_steps) * 100
  );
  
  const is_completed = completion_pct === 100;

  const { data, error } = await supabase
    .from('success_wizard_states')
    .update({
      current_step: params.current_step,
      completed_steps: params.completed_steps,
      completion_pct,
      is_completed,
      completed_at: is_completed ? new Date().toISOString() : null,
      wizard_data: params.wizard_data || state.wizard_data,
    })
    .eq('wizard_type', params.wizard_type)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Complete wizard step
 */
export async function completeWizardStep(params: {
  wizard_type: 'initial_setup' | 'module_setup';
  step_id: string;
  step_data?: Record<string, any>;
}): Promise<SetupWizardState> {
  const state = await getWizardState(params.wizard_type);
  if (!state) throw new Error('Wizard state not found');

  const completed_steps = [...new Set([...state.completed_steps, params.step_id])];
  
  const wizard_data = {
    ...state.wizard_data,
    [params.step_id]: params.step_data || {},
  };

  return updateWizardProgress({
    wizard_type: params.wizard_type,
    current_step: state.current_step,
    completed_steps,
    wizard_data,
  });
}

/**
 * Reset wizard
 */
export async function resetWizard(
  wizard_type: 'initial_setup' | 'module_setup' = 'initial_setup'
): Promise<void> {
  const { error } = await supabase
    .from('success_wizard_states')
    .delete()
    .eq('wizard_type', wizard_type);

  if (error) throw error;
}
