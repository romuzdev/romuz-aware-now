/**
 * Actions Module Hooks
 * Gate-H: Actions Management
 */

export { useGateHActionById } from './useGateHActionById';
export { useGateHActionUpdates } from './useGateHActionUpdates';
export { useGateHActions } from './useGateHActions';
export { useBulkUpdateStatus, useBulkAssign, useBulkDelete } from './useGateHBulk';
export { useGateHExportJSON, useGateHExportCSV, useGateHExport, type ExportFormat, type ExportParams } from './useGateHExport';
export { useGateHImportHistory, useGateHImport } from './useGateHImport';
export {
  useCreateActionFromRecommendation,
  useAddActionUpdate,
  useUpdateActionStatus,
  useVerifyAndCloseAction,
  useSeedDemoActions,
} from './useGateHMutations';
export { useGateHRealtime } from './useGateHRealtime';
export { useGateHViews, useSaveGateHView, useDeleteGateHView } from './useGateHViews';

// M11: Action Plans Enhancement Hooks
export {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useCompleteMilestone,
} from './useMilestones';
export {
  useDependencies,
  useCreateDependency,
  useUpdateDependency,
  useDeleteDependency,
} from './useDependencies';
export {
  useTrackingHistory,
  useActionHealthMetrics,
  useCreateTrackingSnapshot,
  useAutoCreateSnapshot,
} from './useTracking';
export {
  useUserNotifications,
  useActionNotifications,
  useNotificationSummary,
  useCreateNotification,
  useAcknowledgeNotification,
} from './useNotifications';

// M11: AI-Powered Recommendations
export {
  useAIRecommendations,
  useActionSuggestions,
  useActionRisks,
  useActionOptimizations,
  useActionNextSteps,
  useTriggerAIAnalysis,
} from './useActionAI';
