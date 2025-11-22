/**
 * GRC Module Hooks - Barrel Export
 */

export * from './useGRCEvents';
export * from './useRisks';
export * from './useControls';
export * from './useCompliance';
export * from './useAudits';
export * from './useAuditAnalytics';
export * from './useAuditWorkflows';
export * from './useReports';
export * from './useAdvancedRiskAnalytics';
export * from './useThirdPartyRisk';

// Compliance Automation - Explicit exports to avoid conflicts
export {
  useAutomatedComplianceGaps,
  useComplianceDashboard,
  useControlMappingSuggestions,
  useApplyControlMapping,
  useGenerateRemediationPlan,
  useBulkRemediateGaps,
} from './useComplianceAutomation';
