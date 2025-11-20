/**
 * Alerts Module - Integration Layer
 * 
 * Re-exports from existing Supabase integration
 */

export {
  fetchAlertPolicies,
  fetchAlertPolicyById,
  createAlertPolicy,
  updateAlertPolicy,
  deleteAlertPolicy,
  fetchAlertEvents,
  fetchAlertChannels,
  createAlertChannel,
  updateAlertChannel,
  deleteAlertChannel,
  fetchPolicyTargets,
  addPolicyTarget,
  removePolicyTarget,
  fetchPolicyChannels,
  addPolicyChannel,
  removePolicyChannel,
} from '@/modules/observability/integration';
