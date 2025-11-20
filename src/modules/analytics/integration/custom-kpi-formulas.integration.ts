/**
 * M14 Enhancement - Custom KPI Formulas Integration
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  CustomKPIFormula,
  CreateCustomKPIFormulaInput,
  UpdateCustomKPIFormulaInput
} from '../types/custom-kpi.types';

/**
 * Fetch all custom KPI formulas for tenant
 */
export async function fetchCustomKPIFormulas(
  tenantId: string,
  activeOnly: boolean = false
): Promise<CustomKPIFormula[]> {
  let query = supabase
    .from('custom_kpi_formulas')
    .select('*')
    .eq('tenant_id', tenantId);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch single custom KPI formula
 */
export async function fetchCustomKPIFormula(
  formulaId: string
): Promise<CustomKPIFormula> {
  const { data, error } = await supabase
    .from('custom_kpi_formulas')
    .select('*')
    .eq('id', formulaId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create custom KPI formula
 */
export async function createCustomKPIFormula(
  tenantId: string,
  userId: string,
  input: CreateCustomKPIFormulaInput
): Promise<CustomKPIFormula> {
  const { data, error } = await supabase
    .from('custom_kpi_formulas')
    .insert({
      tenant_id: tenantId,
      created_by: userId,
      ...input
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update custom KPI formula
 */
export async function updateCustomKPIFormula(
  formulaId: string,
  input: UpdateCustomKPIFormulaInput
): Promise<CustomKPIFormula> {
  const { data, error } = await supabase
    .from('custom_kpi_formulas')
    .update(input)
    .eq('id', formulaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete custom KPI formula
 */
export async function deleteCustomKPIFormula(
  formulaId: string
): Promise<void> {
  const { error } = await supabase
    .from('custom_kpi_formulas')
    .delete()
    .eq('id', formulaId);

  if (error) throw error;
}

/**
 * Evaluate custom KPI formula
 */
export async function evaluateCustomKPIFormula(
  formulaId: string,
  tenantId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('evaluate_custom_kpi', {
    p_formula_id: formulaId,
    p_tenant_id: tenantId
  });

  if (error) throw error;
  return data as number;
}

/**
 * Available formula variables
 */
export const FORMULA_VARIABLES = [
  {
    name: 'risk_count',
    label: 'عدد المخاطر',
    source: 'grc_risks.id',
    description: 'إجمالي عدد المخاطر المسجلة',
    example: '{risk_count}'
  },
  {
    name: 'high_risk_count',
    label: 'المخاطر العالية',
    source: 'grc_risks.id WHERE severity = \'high\'',
    description: 'عدد المخاطر ذات الخطورة العالية',
    example: '{high_risk_count}'
  },
  {
    name: 'campaign_count',
    label: 'عدد الحملات',
    source: 'awareness_campaigns.id',
    description: 'إجمالي عدد حملات التوعية',
    example: '{campaign_count}'
  },
  {
    name: 'active_campaign_count',
    label: 'الحملات النشطة',
    source: 'awareness_campaigns.id WHERE status = \'active\'',
    description: 'عدد الحملات النشطة حالياً',
    example: '{active_campaign_count}'
  },
  {
    name: 'audit_count',
    label: 'عدد عمليات التدقيق',
    source: 'grc_audits.id',
    description: 'إجمالي عمليات التدقيق',
    example: '{audit_count}'
  },
  {
    name: 'policy_count',
    label: 'عدد السياسات',
    source: 'policies.id',
    description: 'إجمالي السياسات المسجلة',
    example: '{policy_count}'
  },
  {
    name: 'approved_policy_count',
    label: 'السياسات المعتمدة',
    source: 'policies.id WHERE status = \'approved\'',
    description: 'عدد السياسات المعتمدة',
    example: '{approved_policy_count}'
  }
];
