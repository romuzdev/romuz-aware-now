/**
 * Compliance Automation Integration
 * Phase 3: GRC Enhancement - Advanced Features Part 1
 */

import { supabase } from '@/integrations/supabase/client';
import {
  logComplianceAssess,
  logComplianceGapIdentify,
  logComplianceRemediate,
} from '@/lib/audit/unified-grc-logger';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface AutomatedComplianceGap {
  gap_id: string;
  requirement_id: string;
  requirement_code: string;
  requirement_title: string;
  framework_name: string;
  gap_type: string;
  gap_severity: 'critical' | 'high' | 'medium' | 'low';
  gap_description: string;
  recommended_action: string;
  estimated_effort_days: number;
}

export interface ComplianceDashboardMetrics {
  framework_id: string;
  framework_name: string;
  total_requirements: number;
  compliant_count: number;
  partial_compliant_count: number;
  non_compliant_count: number;
  not_assessed_count: number;
  compliance_score: number;
  trend_direction: 'improving' | 'declining' | 'stable';
  last_assessment_date: string;
}

export interface ControlMappingSuggestion {
  control_id: string;
  control_code: string;
  control_title: string;
  match_score: number;
  match_reason: string;
}

// ==========================================
// GAP DETECTION
// ==========================================

export async function detectComplianceGaps(
  tenantId: string,
  frameworkId?: string
): Promise<AutomatedComplianceGap[]> {
  const { data, error } = await supabase.rpc('fn_grc_detect_compliance_gaps', {
    p_tenant_id: tenantId,
    p_framework_id: frameworkId || null,
  });

  if (error) {
    console.error('[Compliance Gaps] Detection error:', error);
    throw new Error(`فشل اكتشاف الفجوات: ${error.message}`);
  }

  // Log gap detection
  if (data && data.length > 0) {
    await logComplianceGapIdentify(tenantId, {
      framework_id: frameworkId,
      gaps_found: data.length,
      critical_gaps: data.filter((g: AutomatedComplianceGap) => g.gap_severity === 'critical').length,
    });
  }

  return data || [];
}

// ==========================================
// COMPLIANCE DASHBOARD
// ==========================================

export async function fetchComplianceDashboard(
  tenantId: string
): Promise<ComplianceDashboardMetrics[]> {
  const { data, error } = await supabase.rpc('fn_grc_get_compliance_dashboard', {
    p_tenant_id: tenantId,
  });

  if (error) {
    console.error('[Compliance Dashboard] Fetch error:', error);
    throw new Error(`فشل تحميل لوحة الامتثال: ${error.message}`);
  }

  // Log dashboard access
  if (data && data.length > 0) {
    await logComplianceAssess(tenantId, {
      action: 'dashboard_view',
      frameworks_count: data.length,
    });
  }

  return data || [];
}

// ==========================================
// AUTO-MAPPING SUGGESTIONS
// ==========================================

export async function getControlMappingSuggestions(
  tenantId: string,
  requirementId: string
): Promise<ControlMappingSuggestion[]> {
  const { data, error } = await supabase.rpc('fn_grc_suggest_control_mappings', {
    p_tenant_id: tenantId,
    p_requirement_id: requirementId,
  });

  if (error) {
    console.error('[Control Mapping] Suggestions error:', error);
    throw new Error(`فشل اقتراح الضوابط: ${error.message}`);
  }

  return data || [];
}

export async function applyControlMapping(
  requirementId: string,
  controlId: string,
  mappingType: 'primary' | 'supporting' = 'primary'
): Promise<void> {
  const { error } = await supabase
    .from('grc_compliance_control_requirements')
    .insert({
      requirement_id: requirementId,
      control_id: controlId,
      mapping_type: mappingType,
    });

  if (error) {
    console.error('[Control Mapping] Apply error:', error);
    throw new Error(`فشل ربط الضابط: ${error.message}`);
  }

  // Log mapping action
  await logComplianceRemediate(requirementId, {
    action: 'control_mapped',
    control_id: controlId,
    mapping_type: mappingType,
  });
}

// ==========================================
// AUTOMATED REMEDIATION
// ==========================================

export interface RemediationPlan {
  gap_id: string;
  requirement_id: string;
  remediation_steps: RemediationStep[];
  estimated_timeline_days: number;
  resources_needed: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface RemediationStep {
  step_number: number;
  description: string;
  responsible_role: string;
  duration_days: number;
  dependencies: number[];
}

export async function generateRemediationPlan(
  gap: AutomatedComplianceGap
): Promise<RemediationPlan> {
  // Generate automated remediation plan based on gap type
  const steps: RemediationStep[] = [];
  
  switch (gap.gap_type) {
    case 'missing_controls':
      steps.push(
        {
          step_number: 1,
          description: 'تحديد الضوابط المطلوبة للامتثال',
          responsible_role: 'compliance_officer',
          duration_days: 2,
          dependencies: [],
        },
        {
          step_number: 2,
          description: 'توثيق إجراءات الضابط',
          responsible_role: 'process_owner',
          duration_days: 5,
          dependencies: [1],
        },
        {
          step_number: 3,
          description: 'تدريب الفريق على الضوابط',
          responsible_role: 'training_manager',
          duration_days: 3,
          dependencies: [2],
        },
        {
          step_number: 4,
          description: 'تطبيق الضوابط بشكل تجريبي',
          responsible_role: 'process_owner',
          duration_days: 10,
          dependencies: [3],
        },
        {
          step_number: 5,
          description: 'اختبار فعالية الضوابط',
          responsible_role: 'internal_audit',
          duration_days: 5,
          dependencies: [4],
        }
      );
      break;
      
    case 'ineffective_controls':
      steps.push(
        {
          step_number: 1,
          description: 'مراجعة أسباب عدم الفعالية',
          responsible_role: 'internal_audit',
          duration_days: 3,
          dependencies: [],
        },
        {
          step_number: 2,
          description: 'تحديث إجراءات التشغيل',
          responsible_role: 'process_owner',
          duration_days: 7,
          dependencies: [1],
        },
        {
          step_number: 3,
          description: 'إعادة الاختبار',
          responsible_role: 'internal_audit',
          duration_days: 3,
          dependencies: [2],
        }
      );
      break;
      
    default:
      steps.push({
        step_number: 1,
        description: gap.recommended_action,
        responsible_role: 'compliance_officer',
        duration_days: gap.estimated_effort_days,
        dependencies: [],
      });
  }
  
  const plan: RemediationPlan = {
    gap_id: gap.gap_id,
    requirement_id: gap.requirement_id,
    remediation_steps: steps,
    estimated_timeline_days: steps.reduce((sum, step) => sum + step.duration_days, 0),
    resources_needed: [
      'فريق الامتثال',
      'مالك العملية',
      'المدقق الداخلي',
    ],
    priority: gap.gap_severity,
  };
  
  // Log remediation plan generation
  await logComplianceRemediate(gap.requirement_id, {
    action: 'plan_generated',
    gap_type: gap.gap_type,
    steps_count: steps.length,
    estimated_days: plan.estimated_timeline_days,
  });
  
  return plan;
}

// ==========================================
// BULK GAP REMEDIATION
// ==========================================

export async function bulkRemediateGaps(
  gaps: AutomatedComplianceGap[],
  remediationType: 'auto_map' | 'create_controls' | 'assign_owners'
): Promise<{
  success_count: number;
  failed_count: number;
  errors: string[];
}> {
  let success_count = 0;
  let failed_count = 0;
  const errors: string[] = [];
  
  for (const gap of gaps) {
    try {
      if (remediationType === 'auto_map') {
        // Get mapping suggestions
        const suggestions = await getControlMappingSuggestions(
          gap.requirement_id.split('-')[0], // Extract tenant_id (simplified)
          gap.requirement_id
        );
        
        // Apply top suggestion if match score > 0.5
        if (suggestions.length > 0 && suggestions[0].match_score > 0.5) {
          await applyControlMapping(gap.requirement_id, suggestions[0].control_id);
          success_count++;
        } else {
          failed_count++;
          errors.push(`${gap.requirement_code}: لا توجد اقتراحات مناسبة`);
        }
      }
      // Add more remediation types as needed
    } catch (error: any) {
      failed_count++;
      errors.push(`${gap.requirement_code}: ${error.message}`);
    }
  }
  
  return { success_count, failed_count, errors };
}
