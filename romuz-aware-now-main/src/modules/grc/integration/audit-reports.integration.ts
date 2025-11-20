/**
 * GRC Audit Reports Integration
 * M12: Report generation and gap analysis
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ReportOptions,
  GeneratedReport,
  GapAnalysisResult,
  AuditComplianceGap,
  FindingResolution,
} from '../types/audit-workflow.types';
import type { GapSeverity } from '../types/compliance.types';

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate audit report
 * Roadmap specification: generateAuditReport
 */
export async function generateAuditReport(
  auditId: string,
  options: ReportOptions
): Promise<GeneratedReport> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  // Fetch audit data
  const { data: audit, error: auditError } = await supabase
    .from('grc_audits')
    .select('*')
    .eq('id', auditId)
    .single();

  if (auditError) throw auditError;

  // Fetch findings if needed
  let findings = null;
  if (options.type !== 'executive') {
    const { data: findingsData, error: findingsError } = await supabase
      .from('grc_audit_findings')
      .select('*')
      .eq('audit_id', auditId)
      .order('severity', { ascending: false });

    if (findingsError) throw findingsError;
    findings = findingsData;
  }

  // Create report metadata
  const report: GeneratedReport = {
    report_id: crypto.randomUUID(),
    audit_id: auditId,
    type: options.type,
    format: options.format,
    generated_at: new Date().toISOString(),
    generated_by: userId!,
    metadata: {
      audit_code: audit.audit_code,
      audit_title: audit.audit_title,
      audit_title_ar: audit.audit_title_ar,
      findings_count: findings?.length || 0,
      options,
    },
  };

  // Here you would implement actual report generation logic
  // For now, we'll return the metadata
  // In a real implementation, this would:
  // 1. Generate PDF/Excel/Word file using a library
  // 2. Upload to Supabase Storage
  // 3. Return the file URL

  console.log('تم إنشاء التقرير:', report);
  
  return report;
}

/**
 * Export report to file
 */
export async function exportReportToFile(
  report: GeneratedReport,
  fileBlob: Blob
): Promise<string> {
  const fileName = `audit_report_${report.audit_id}_${Date.now()}.${report.format}`;
  const filePath = `audit-reports/${report.audit_id}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, fileBlob, {
      contentType: getMimeType(report.format),
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    json: 'application/json',
  };
  return mimeTypes[format] || 'application/octet-stream';
}

// ============================================================================
// Compliance Gap Analysis
// ============================================================================

/**
 * Analyze compliance gaps between audit findings and framework requirements
 */
export async function analyzeComplianceGaps(
  auditId: string,
  frameworkId?: string
): Promise<GapAnalysisResult> {
  // Get audit details
  const { data: audit, error: auditError } = await supabase
    .from('grc_audits')
    .select('*, grc_frameworks(*)')
    .eq('id', auditId)
    .single();

  if (auditError) throw auditError;

  const targetFrameworkId = frameworkId || audit.framework_id;
  if (!targetFrameworkId) {
    throw new Error('لم يتم تحديد إطار الامتثال');
  }

  // Get framework requirements
  const { data: requirements, error: reqError } = await supabase
    .from('grc_framework_requirements')
    .select('*')
    .eq('framework_id', targetFrameworkId);

  if (reqError) throw reqError;

  // Get audit findings
  const { data: findings, error: findingsError } = await supabase
    .from('grc_audit_findings')
    .select('*')
    .eq('audit_id', auditId);

  if (findingsError) throw findingsError;

  // Get controls
  const { data: controls, error: controlsError } = await supabase
    .from('grc_controls')
    .select('*')
    .eq('framework_id', targetFrameworkId);

  if (controlsError) throw controlsError;

  // Analyze gaps
  const gaps: AuditComplianceGap[] = [];
  let compliantCount = 0;

  for (const req of requirements || []) {
    // Check if requirement has associated controls
    const relatedControls = controls?.filter(c => 
      c.linked_requirement_ids?.includes(req.id)
    ) || [];

    // Check if there are findings related to this requirement
    const relatedFindings = findings?.filter(f => 
      f.linked_requirement_id === req.id
    ) || [];

    // Determine compliance status
    const hasFindings = relatedFindings.length > 0;
    const hasControls = relatedControls.length > 0;
    const controlsEffective = relatedControls.every(c => 
      c.effectiveness_rating !== 'ineffective'
    );

    if (!hasFindings && hasControls && controlsEffective) {
      compliantCount++;
      continue; // No gap
    }

    // Determine gap severity
    let gapSeverity: GapSeverity = 'low';
    if (relatedFindings.some(f => f.severity === 'critical')) {
      gapSeverity = 'critical';
    } else if (relatedFindings.some(f => f.severity === 'high')) {
      gapSeverity = 'high';
    } else if (relatedFindings.length > 0 || !hasControls) {
      gapSeverity = 'medium';
    }

    // Create gap entry
    const gap: AuditComplianceGap = {
      id: crypto.randomUUID(),
      framework_requirement_id: req.id,
      requirement_code: req.requirement_code,
      requirement_title: req.requirement_title,
      requirement_title_ar: req.requirement_title_ar,
      current_status: hasFindings ? 'non_compliant' : 'partially_compliant',
      target_status: 'compliant',
      gap_severity: gapSeverity,
      gap_description: `يوجد ${relatedFindings.length} نتيجة تدقيق مرتبطة بهذا المتطلب`,
      gap_description_ar: `يوجد ${relatedFindings.length} نتيجة تدقيق مرتبطة بهذا المتطلب`,
      recommended_actions: [
        'مراجعة الضوابط الحالية',
        'تطبيق الإجراءات التصحيحية',
        'تحديث السياسات والإجراءات',
      ],
      linked_findings: relatedFindings.map(f => f.id),
      estimated_effort_days: relatedFindings.length * 5,
      priority: gapSeverity === 'critical' ? 1 : gapSeverity === 'high' ? 2 : 3,
    };

    gaps.push(gap);
  }

  // Calculate compliance score
  const totalRequirements = requirements?.length || 0;
  const complianceScore = totalRequirements > 0 
    ? Math.round((compliantCount / totalRequirements) * 100)
    : 0;

  // Create heat map
  const riskHeatMap = [
    { severity: 'critical' as const, count: gaps.filter(g => g.gap_severity === 'critical').length, percentage: 0 },
    { severity: 'high' as const, count: gaps.filter(g => g.gap_severity === 'high').length, percentage: 0 },
    { severity: 'medium' as const, count: gaps.filter(g => g.gap_severity === 'medium').length, percentage: 0 },
    { severity: 'low' as const, count: gaps.filter(g => g.gap_severity === 'low').length, percentage: 0 },
  ];

  const totalGaps = gaps.length;
  riskHeatMap.forEach(item => {
    item.percentage = totalGaps > 0 ? Math.round((item.count / totalGaps) * 100) : 0;
  });

  return {
    audit_id: auditId,
    framework_id: targetFrameworkId,
    framework_name: audit.grc_frameworks?.framework_name || 'N/A',
    total_requirements: totalRequirements,
    compliant_requirements: compliantCount,
    gaps_identified: gaps.length,
    compliance_score: complianceScore,
    gaps: gaps.sort((a, b) => a.priority - b.priority),
    risk_heat_map: riskHeatMap,
    generated_at: new Date().toISOString(),
  };
}

// ============================================================================
// Finding Resolution Tracking
// ============================================================================

/**
 * Track finding resolution progress
 * Roadmap specification: trackFindingResolution
 */
export async function trackFindingResolution(findingId: string): Promise<FindingResolution> {
  const { data: finding, error } = await supabase
    .from('grc_audit_findings')
    .select('*')
    .eq('id', findingId)
    .single();

  if (error) throw error;

  const resolution: FindingResolution = {
    finding_id: findingId,
    resolution_status: finding.finding_status as any,
    resolution_date: finding.actual_closure_date || undefined,
    resolution_notes: finding.management_response || undefined,
    verified_by: finding.verified_by || undefined,
    verification_date: finding.verified_date || undefined,
    linked_action_id: finding.linked_action_id || undefined,
    evidence_urls: finding.evidence_files || undefined,
  };

  return resolution;
}

/**
 * Update finding resolution status
 */
export async function updateFindingResolution(
  findingId: string,
  resolution: Partial<FindingResolution>
): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  const updates: any = {
    updated_by: userId,
  };

  if (resolution.resolution_status) {
    updates.finding_status = resolution.resolution_status;
  }

  if (resolution.resolution_notes) {
    updates.management_response = resolution.resolution_notes;
  }

  if (resolution.verified_by) {
    updates.verified_by = resolution.verified_by;
    updates.verified_date = new Date().toISOString().split('T')[0];
  }

  if (resolution.resolution_status === 'closed') {
    updates.actual_closure_date = new Date().toISOString().split('T')[0];
  }

  const { error } = await supabase
    .from('grc_audit_findings')
    .update(updates)
    .eq('id', findingId);

  if (error) throw error;
}

/**
 * Record new finding
 * Roadmap specification: recordFinding
 */
export async function recordFinding(input: {
  audit_id: string;
  finding_type: string;
  severity: string;
  finding_title: string;
  finding_description: string;
  recommendation: string;
  responsible_user_id?: string;
  target_closure_date?: string;
}): Promise<any> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  const { data: tenantRows } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId as string)
    .limit(1);

  const tenantId = tenantRows?.[0]?.tenant_id;
  if (!tenantId) {
    throw new Error('لا يمكن تسجيل نتيجة بدون سياق المستأجر');
  }

  // Generate finding code
  const { data: existingFindings } = await supabase
    .from('grc_audit_findings')
    .select('finding_code')
    .eq('audit_id', input.audit_id)
    .order('created_at', { ascending: false })
    .limit(1);

  let findingCode = `F-001`;
  if (existingFindings && existingFindings.length > 0) {
    const lastCode = existingFindings[0].finding_code;
    const num = parseInt(lastCode.split('-')[1]) + 1;
    findingCode = `F-${num.toString().padStart(3, '0')}`;
  }

  const { data, error } = await supabase
    .from('grc_audit_findings')
    .insert({
      tenant_id: tenantId,
      audit_id: input.audit_id,
      finding_code: findingCode,
      finding_type: input.finding_type,
      severity: input.severity,
      finding_title: input.finding_title,
      finding_description: input.finding_description,
      recommendation: input.recommendation,
      responsible_user_id: input.responsible_user_id,
      target_closure_date: input.target_closure_date,
      finding_status: 'open',
      identified_by: userId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
