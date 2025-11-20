import { supabase } from '@/integrations/supabase/client';
import type { Module, ModuleProgress, ModuleFormData } from '@/modules/campaigns';

export async function fetchModules(campaignId: string): Promise<Module[]> {
  const { data, error } = await supabase
    .from('campaign_modules')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapModule);
}

export async function createModule(
  tenantId: string,
  campaignId: string,
  formData: ModuleFormData
): Promise<Module> {
  // Get max position
  const { data: existing } = await supabase
    .from('campaign_modules')
    .select('position')
    .eq('campaign_id', campaignId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = existing ? existing.position + 1 : 1;

  const { data, error } = await supabase
    .from('campaign_modules')
    .insert({
      tenant_id: tenantId,
      campaign_id: campaignId,
      title: formData.title,
      type: formData.type,
      url_or_ref: formData.urlOrRef || null,
      content: formData.content || null,
      is_required: formData.isRequired,
      estimated_minutes: formData.estimatedMinutes || null,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapModule(data);
}

export async function updateModule(
  id: string,
  formData: Partial<ModuleFormData>
): Promise<void> {
  const { error } = await supabase
    .from('campaign_modules')
    .update({
      title: formData.title,
      type: formData.type,
      url_or_ref: formData.urlOrRef,
      content: formData.content,
      is_required: formData.isRequired,
      estimated_minutes: formData.estimatedMinutes,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteModule(id: string): Promise<void> {
  const { error } = await supabase
    .from('campaign_modules')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function reorderModules(
  campaignId: string,
  moduleId: string,
  direction: 'up' | 'down'
): Promise<void> {
  // Fetch all modules
  const { data: modules, error: fetchError } = await supabase
    .from('campaign_modules')
    .select('id, position')
    .eq('campaign_id', campaignId)
    .order('position', { ascending: true });

  if (fetchError) throw new Error(fetchError.message);
  if (!modules || modules.length === 0) return;

  const currentIndex = modules.findIndex(m => m.id === moduleId);
  if (currentIndex === -1) return;

  const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (swapIndex < 0 || swapIndex >= modules.length) return;

  const current = modules[currentIndex];
  const swap = modules[swapIndex];

  // Swap positions
  const { error: e1 } = await supabase
    .from('campaign_modules')
    .update({ position: swap.position })
    .eq('id', current.id);

  const { error: e2 } = await supabase
    .from('campaign_modules')
    .update({ position: current.position })
    .eq('id', swap.id);

  if (e1 || e2) throw new Error('Failed to reorder modules');
}

export async function fetchModuleProgress(participantId: string): Promise<ModuleProgress[]> {
  const { data, error } = await supabase
    .from('module_progress')
    .select('*')
    .eq('participant_id', participantId);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProgress);
}

export async function markModuleStarted(
  tenantId: string,
  campaignId: string,
  moduleId: string,
  participantId: string
): Promise<void> {
  const { data: existing } = await supabase
    .from('module_progress')
    .select('id, status')
    .eq('participant_id', participantId)
    .eq('module_id', moduleId)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'not_started') {
      await supabase
        .from('module_progress')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          last_visit_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('module_progress')
        .update({ last_visit_at: new Date().toISOString() })
        .eq('id', existing.id);
    }
  } else {
    await supabase.from('module_progress').insert({
      tenant_id: tenantId,
      campaign_id: campaignId,
      module_id: moduleId,
      participant_id: participantId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      last_visit_at: new Date().toISOString(),
    });
  }
}

export async function markModuleCompleted(
  tenantId: string,
  campaignId: string,
  moduleId: string,
  participantId: string
): Promise<void> {
  const { data: existing } = await supabase
    .from('module_progress')
    .select('id')
    .eq('participant_id', participantId)
    .eq('module_id', moduleId)
    .maybeSingle();

  const now = new Date().toISOString();

  if (existing) {
    await supabase
      .from('module_progress')
      .update({
        status: 'completed',
        completed_at: now,
        last_visit_at: now,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('module_progress').insert({
      tenant_id: tenantId,
      campaign_id: campaignId,
      module_id: moduleId,
      participant_id: participantId,
      status: 'completed',
      started_at: now,
      completed_at: now,
      last_visit_at: now,
    });
  }
}

export async function checkCampaignCompletion(
  campaignId: string,
  participantId: string
): Promise<boolean> {
  // Get all required modules
  const { data: modules, error: e1 } = await supabase
    .from('campaign_modules')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('is_required', true);

  if (e1 || !modules || modules.length === 0) return false;

  // Get completed progress
  const { data: progress, error: e2 } = await supabase
    .from('module_progress')
    .select('module_id')
    .eq('participant_id', participantId)
    .eq('status', 'completed');

  if (e2 || !progress) return false;

  const completedIds = new Set(progress.map(p => p.module_id));
  return modules.every(m => completedIds.has(m.id));
}

function mapModule(raw: any): Module {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    campaignId: raw.campaign_id,
    title: raw.title,
    type: raw.type,
    urlOrRef: raw.url_or_ref,
    content: raw.content,
    position: raw.position,
    isRequired: raw.is_required,
    estimatedMinutes: raw.estimated_minutes,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapProgress(raw: any): ModuleProgress {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    campaignId: raw.campaign_id,
    moduleId: raw.module_id,
    participantId: raw.participant_id,
    status: raw.status,
    startedAt: raw.started_at,
    completedAt: raw.completed_at,
    lastVisitAt: raw.last_visit_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
