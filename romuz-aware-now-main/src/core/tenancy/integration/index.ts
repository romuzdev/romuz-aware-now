/**
 * Multi-Tenancy Module
 * 
 * Provides multi-tenant helpers and utilities
 */

// Export from tenants (basic tenant operations)
export { 
  type Tenant, 
  fetchTenants,
  setDefaultTenant,
  getDefaultTenant 
} from './tenants.integration';

// Export from platform (advanced lifecycle management)
export {
  type TenantLifecycleLog,
  type TenantHealthStatus,
  type ScheduledTransition,
  type TenantSettings,
  type TenantSettingsResponse,
  fetchLifecycleLog,
  fetchHealthStatus,
  triggerTenantEvent,
  sendTenantNotification,
  scheduleTransition,
  fetchScheduledTransitions,
  cancelScheduledTransition,
  updateScheduledTransition,
  startDeprovision,
  fetchAutomationActions,
  getTenantSettings,
  updateTenantSettings,
  useTenantSettings,
  useTenants,
  useUpdateTenantSettings
} from './platform.integration';

// Export from users
export {
  type UserWithTenant,
  fetchUsersWithTenant,
  updateUserTenant,
  fetchAllTenants
} from './users.integration';

// Export from profiles (main profile operations)
export {
  type UserProfile,
  fetchMyProfile,
  updateMyProfile,
  uploadAvatar,
  isProfileComplete
} from './profiles.integration';

// Export from user-profiles (theme preferences)
export {
  type ThemePreference,
  getUserProfile,
  updateThemePreference,
  subscribeToThemeChanges
} from './user-profiles.integration';
