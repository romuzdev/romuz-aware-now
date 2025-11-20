/**
 * GRC (Governance, Risk, Compliance) Module - Event Integration Hook
 * 
 * Integration between GRC and Event System
 * Handles: Policies, Risks, Controls, Audits, Compliance
 */

import { useCallback } from 'react';
import { useEventBus } from '@/lib/events/useEventBus';
import type { PublishEventParams } from '@/lib/events/event.types';

export function useGRCEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Policy Approved Event
   */
  const publishPolicyApproved = useCallback(async (
    policyId: string,
    approvalData: {
      policy_title: string;
      version: string;
      approved_by: string;
      approval_date: string;
      effective_date: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'policy_approved',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'policy',
      entity_id: policyId,
      priority: 'high',
      payload: {
        policy_id: policyId,
        policy_title: approvalData.policy_title,
        version: approvalData.version,
        approved_by: approvalData.approved_by,
        approval_date: approvalData.approval_date,
        effective_date: approvalData.effective_date,
        approved_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Risk Identified Event
   */
  const publishRiskIdentified = useCallback(async (
    riskId: string,
    riskData: {
      risk_title: string;
      category: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      likelihood: number;
      impact: number;
      risk_score: number;
      identified_by: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'risk_identified',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'risk',
      entity_id: riskId,
      priority: riskData.severity === 'critical' ? 'critical' : 'high',
      payload: {
        risk_id: riskId,
        risk_title: riskData.risk_title,
        category: riskData.category,
        severity: riskData.severity,
        likelihood: riskData.likelihood,
        impact: riskData.impact,
        risk_score: riskData.risk_score,
        identified_by: riskData.identified_by,
        identified_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Control Implemented Event
   */
  const publishControlImplemented = useCallback(async (
    controlId: string,
    controlData: {
      control_title: string;
      control_type: string;
      related_risks: string[];
      owner: string;
      implementation_date: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'control_implemented',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'control',
      entity_id: controlId,
      priority: 'medium',
      payload: {
        control_id: controlId,
        control_title: controlData.control_title,
        control_type: controlData.control_type,
        related_risks: controlData.related_risks,
        owner: controlData.owner,
        implementation_date: controlData.implementation_date,
        implemented_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Control Test Failed Event
   */
  const publishControlTestFailed = useCallback(async (
    testId: string,
    testData: {
      control_id: string;
      control_code: string;
      control_title: string;
      test_code: string;
      test_title: string;
      test_date: string;
      test_result: string;
      test_findings: string;
      tested_by: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'control_test_failed',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'control_test',
      entity_id: testId,
      priority: 'high',
      payload: {
        test_id: testId,
        control_id: testData.control_id,
        control_code: testData.control_code,
        control_title: testData.control_title,
        test_code: testData.test_code,
        test_title: testData.test_title,
        test_date: testData.test_date,
        test_result: testData.test_result,
        test_findings: testData.test_findings,
        tested_by: testData.tested_by,
        failed_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Control Effectiveness Updated Event
   */
  const publishControlEffectivenessUpdated = useCallback(async (
    controlId: string,
    effectivenessData: {
      control_code: string;
      control_title: string;
      previous_rating: string | null;
      new_rating: string;
      test_id: string;
      updated_by: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'control_effectiveness_updated',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'control',
      entity_id: controlId,
      priority: effectivenessData.new_rating === 'ineffective' ? 'high' : 'medium',
      payload: {
        control_id: controlId,
        control_code: effectivenessData.control_code,
        control_title: effectivenessData.control_title,
        previous_rating: effectivenessData.previous_rating,
        new_rating: effectivenessData.new_rating,
        test_id: effectivenessData.test_id,
        updated_by: effectivenessData.updated_by,
        updated_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Control Remediation Due Event
   */
  const publishControlRemediationDue = useCallback(async (
    testId: string,
    remediationData: {
      control_id: string;
      control_code: string;
      control_title: string;
      test_code: string;
      remediation_plan: string;
      remediation_due_date: string;
      days_overdue: number;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'control_remediation_due',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'control_test',
      entity_id: testId,
      priority: remediationData.days_overdue > 0 ? 'high' : 'medium',
      payload: {
        test_id: testId,
        control_id: remediationData.control_id,
        control_code: remediationData.control_code,
        control_title: remediationData.control_title,
        test_code: remediationData.test_code,
        remediation_plan: remediationData.remediation_plan,
        remediation_due_date: remediationData.remediation_due_date,
        days_overdue: remediationData.days_overdue,
        checked_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Audit Scheduled Event
   */
  const publishAuditScheduled = useCallback(async (
    auditId: string,
    auditData: {
      audit_title: string;
      audit_type: string;
      scope: string;
      scheduled_date: string;
      auditor: string;
      scheduled_by: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'audit_scheduled',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'audit',
      entity_id: auditId,
      priority: 'medium',
      payload: {
        audit_id: auditId,
        audit_title: auditData.audit_title,
        audit_type: auditData.audit_type,
        scope: auditData.scope,
        scheduled_date: auditData.scheduled_date,
        auditor: auditData.auditor,
        scheduled_by: auditData.scheduled_by,
        scheduled_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Compliance Status Changed Event
   */
  const publishComplianceStatusChanged = useCallback(async (
    entityId: string,
    complianceData: {
      entity_type: string;
      entity_name: string;
      old_status: string;
      new_status: string;
      framework: string;
      changed_by: string;
      reason?: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'compliance_status_changed',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'compliance',
      entity_id: entityId,
      priority: 'high',
      payload: {
        entity_id: entityId,
        entity_type: complianceData.entity_type,
        entity_name: complianceData.entity_name,
        old_status: complianceData.old_status,
        new_status: complianceData.new_status,
        framework: complianceData.framework,
        changed_by: complianceData.changed_by,
        reason: complianceData.reason,
        changed_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishPolicyApproved,
    publishRiskIdentified,
    publishControlImplemented,
    publishControlTestFailed,
    publishControlEffectivenessUpdated,
    publishControlRemediationDue,
    publishAuditScheduled,
    publishComplianceStatusChanged,
  };
}
