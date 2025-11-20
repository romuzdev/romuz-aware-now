/**
 * Policies Module - Integration Layer
 * 
 * Re-exports from existing Supabase integration
 */

export {
  fetchPoliciesForTenant,
  fetchPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  logPolicyReadAction,
  bulkUpdatePolicyStatus,
} from './policies-crud';

export {
  bulkUpdatePolicyStatusRPC,
  bulkDeletePolicies,
  getBulkOperationsHistory,
} from './policies-bulk';

export {
  importPolicies,
  getImportHistory,
} from './policies-import';

export {
  savePolicyView,
  listPolicyViews,
  deletePolicyView,
} from './policies-views';
