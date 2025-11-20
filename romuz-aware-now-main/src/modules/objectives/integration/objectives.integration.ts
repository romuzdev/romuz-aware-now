/**
 * D4 - Objectives & KPIs Module: Integration Layer
 * Provides CRUD operations for objectives, KPIs, targets, readings, and initiatives
 */

import { supabase } from '@/integrations/supabase/client';
import {
  ObjectiveGuards,
  KPIGuards,
  KPITargetGuards,
  KPIReadingGuards,
  InitiativeGuards,
} from './objectives-guards';
import type {
  Objective,
  KPI,
  KPITarget,
  KPIReading,
  Initiative,
  CreateObjectiveInput,
  UpdateObjectiveInput,
  CreateKPIInput,
  UpdateKPIInput,
  CreateKPITargetInput,
  UpdateKPITargetInput,
  CreateKPIReadingInput,
  UpdateKPIReadingInput,
  CreateInitiativeInput,
  UpdateInitiativeInput,
  ObjectiveWithDetails,
  KPIWithDetails,
  ObjectiveFilters,
  KPIFilters,
} from '../types';

/**
 * Get current tenant ID from user context
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

/**
 * Log audit action
 */
async function logAudit(
  entityType: string,
  entityId: string,
  action: string,
  payload?: Record<string, any>
) {
  try {
    const tenantId = await getCurrentTenantId();
    const userId = await getCurrentUserId();

    await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      actor: userId,
      payload: payload || {},
    });
  } catch (err: any) {
    console.warn(`⚠️ Failed to log ${action} action:`, err.message);
  }
}

// ============================================================================
// OBJECTIVES
// ============================================================================

/**
 * Fetch all objectives for current tenant with optional filters
 */
export async function fetchObjectives(filters?: ObjectiveFilters) {
  await ObjectiveGuards.requireRead();

  let query = supabase
    .from('objectives')
    .select('*')
    .order('updated_at', { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.owner) {
    query = query.eq('owner_user_id', filters.owner);
  }
  if (filters?.q) {
    query = query.or(`title.ilike.%${filters.q}%,code.ilike.%${filters.q}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Objective[];
}

/**
 * Fetch single objective by ID with related data
 */
export async function fetchObjectiveById(id: string): Promise<ObjectiveWithDetails | null> {
  await ObjectiveGuards.requireRead();

  const { data, error } = await supabase
    .from('objectives')
    .select(`
      *,
      kpis (*),
      initiatives (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ fetchObjectiveById error:', error.message);
    return null;
  }

  // Log audit
  await logAudit('objective', id, 'read');

  return data as ObjectiveWithDetails;
}

/**
 * Create new objective
 */
export async function createObjective(input: CreateObjectiveInput): Promise<Objective> {
  await ObjectiveGuards.requireWrite();

  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('No tenant context');

  const { data, error } = await supabase
    .from('objectives')
    .insert({
      tenant_id: tenantId,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAudit('objective', data.id, 'create', { code: input.code, title: input.title });

  return data as Objective;
}

/**
 * Update existing objective
 */
export async function updateObjective(id: string, input: UpdateObjectiveInput): Promise<Objective> {
  await ObjectiveGuards.requireWrite();

  const { data, error } = await supabase
    .from('objectives')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAudit('objective', id, 'update', input);

  return data as Objective;
}

/**
 * Delete objective
 */
export async function deleteObjective(id: string): Promise<void> {
  await ObjectiveGuards.requireDelete();

  const { error } = await supabase
    .from('objectives')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Log audit
  await logAudit('objective', id, 'delete');
}

// ============================================================================
// KPIs
// ============================================================================

/**
 * Fetch all KPIs for current tenant with optional filters
 */
export async function fetchKPIs(filters?: KPIFilters) {
  await KPIGuards.requireRead();

  let query = supabase
    .from('kpis')
    .select('*, objective:objectives(*)')
    .order('updated_at', { ascending: false });

  // Apply filters
  if (filters?.objective_id) {
    query = query.eq('objective_id', filters.objective_id);
  }
  if (filters?.unit) {
    query = query.eq('unit', filters.unit);
  }
  if (filters?.direction) {
    query = query.eq('direction', filters.direction);
  }
  if (filters?.q) {
    query = query.or(`title.ilike.%${filters.q}%,code.ilike.%${filters.q}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as KPI[];
}

/**
 * Fetch single KPI by ID with related data
 */
export async function fetchKPIById(id: string): Promise<KPIWithDetails | null> {
  await KPIGuards.requireRead();

  const { data, error } = await supabase
    .from('kpis')
    .select(`
      *,
      objective:objectives(*),
      targets:kpi_targets(*),
      readings:kpi_readings(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ fetchKPIById error:', error.message);
    return null;
  }

  // Log audit
  await logAudit('kpi', id, 'read');

  return data as KPIWithDetails;
}

/**
 * Create new KPI
 */
export async function createKPI(input: CreateKPIInput): Promise<KPI> {
  await KPIGuards.requireWrite();

  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('No tenant context');

  const { data, error } = await supabase
    .from('kpis')
    .insert({
      tenant_id: tenantId,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAudit('kpi', data.id, 'create', { code: input.code, title: input.title });

  return data as KPI;
}

/**
 * Update existing KPI
 */
export async function updateKPI(id: string, input: UpdateKPIInput): Promise<KPI> {
  await KPIGuards.requireWrite();

  const { data, error } = await supabase
    .from('kpis')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAudit('kpi', id, 'update', input);

  return data as KPI;
}

/**
 * Delete KPI
 */
export async function deleteKPI(id: string): Promise<void> {
  await KPIGuards.requireDelete();

  const { error } = await supabase
    .from('kpis')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Log audit
  await logAudit('kpi', id, 'delete');
}

// ============================================================================
// KPI TARGETS
// ============================================================================

/**
 * Fetch all targets for a specific KPI
 */
export async function fetchKPITargets(kpiId: string): Promise<KPITarget[]> {
  await KPITargetGuards.requireRead();

  const { data, error } = await supabase
    .from('kpi_targets')
    .select('*')
    .eq('kpi_id', kpiId)
    .order('period', { ascending: false });

  if (error) throw error;
  return data as KPITarget[];
}

/**
 * Create new KPI target
 */
export async function createKPITarget(input: CreateKPITargetInput): Promise<KPITarget> {
  await KPITargetGuards.requireWrite();

  const { data, error } = await supabase
    .from('kpi_targets')
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAudit('kpi_target', data.id, 'create', { kpi_id: input.kpi_id, period: input.period });

  return data as KPITarget;
}

/**
 * Update existing KPI target
 */
export async function updateKPITarget(id: string, input: UpdateKPITargetInput): Promise<KPITarget> {
  await KPITargetGuards.requireWrite();

  const { data, error } = await supabase
    .from('kpi_targets')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAudit('kpi_target', id, 'update', input);

  return data as KPITarget;
}

/**
 * Delete KPI target
 */
export async function deleteKPITarget(id: string): Promise<void> {
  await KPITargetGuards.requireWrite();

  const { error } = await supabase
    .from('kpi_targets')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Log audit
  await logAudit('kpi_target', id, 'delete');
}

// ============================================================================
// KPI READINGS
// ============================================================================

/**
 * Fetch all readings for a specific KPI
 */
export async function fetchKPIReadings(kpiId: string): Promise<KPIReading[]> {
  await KPIReadingGuards.requireRead();

  const { data, error } = await supabase
    .from('kpi_readings')
    .select('*')
    .eq('kpi_id', kpiId)
    .order('period', { ascending: false });

  if (error) throw error;
  return data as KPIReading[];
}

/**
 * Create new KPI reading
 */
export async function createKPIReading(input: CreateKPIReadingInput): Promise<KPIReading> {
  await KPIReadingGuards.requireWrite();

  const { data, error } = await supabase
    .from('kpi_readings')
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAudit('kpi_reading', data.id, 'create', { kpi_id: input.kpi_id, period: input.period });

  return data as KPIReading;
}

/**
 * Update existing KPI reading
 */
export async function updateKPIReading(id: string, input: UpdateKPIReadingInput): Promise<KPIReading> {
  await KPIReadingGuards.requireWrite();

  const { data, error } = await supabase
    .from('kpi_readings')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAudit('kpi_reading', id, 'update', input);

  return data as KPIReading;
}

/**
 * Delete KPI reading
 */
export async function deleteKPIReading(id: string): Promise<void> {
  await KPIReadingGuards.requireWrite();

  const { error } = await supabase
    .from('kpi_readings')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Log audit
  await logAudit('kpi_reading', id, 'delete');
}

// ============================================================================
// INITIATIVES
// ============================================================================

/**
 * Fetch all initiatives for a specific objective
 */
export async function fetchInitiatives(objectiveId: string): Promise<Initiative[]> {
  await InitiativeGuards.requireRead();

  const { data, error } = await supabase
    .from('initiatives')
    .select('*')
    .eq('objective_id', objectiveId)
    .order('start_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data as Initiative[];
}

/**
 * Fetch single initiative by ID
 */
export async function fetchInitiativeById(id: string): Promise<Initiative | null> {
  await InitiativeGuards.requireRead();

  const { data, error } = await supabase
    .from('initiatives')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ fetchInitiativeById error:', error.message);
    return null;
  }

  // Log audit
  await logAudit('initiative', id, 'read');

  return data as Initiative;
}

/**
 * Create new initiative
 */
export async function createInitiative(input: CreateInitiativeInput): Promise<Initiative> {
  await InitiativeGuards.requireWrite();

  const { data, error } = await supabase
    .from('initiatives')
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAudit('initiative', data.id, 'create', { objective_id: input.objective_id, title: input.title });

  return data as Initiative;
}

/**
 * Update existing initiative
 */
export async function updateInitiative(id: string, input: UpdateInitiativeInput): Promise<Initiative> {
  await InitiativeGuards.requireWrite();

  const { data, error } = await supabase
    .from('initiatives')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAudit('initiative', id, 'update', input);

  return data as Initiative;
}

/**
 * Delete initiative
 */
export async function deleteInitiative(id: string): Promise<void> {
  await InitiativeGuards.requireDelete();

  const { error } = await supabase
    .from('initiatives')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Log audit
  await logAudit('initiative', id, 'delete');
}
