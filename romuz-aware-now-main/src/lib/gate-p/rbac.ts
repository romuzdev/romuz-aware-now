/**
 * Gate-P RBAC Guards
 * Role-based access control for Tenant Lifecycle Management
 */

export type GatePRole = 'super_admin' | 'tenant_admin' | 'tenant_viewer';

/**
 * Check if user can manage tenant lifecycle (transitions, deprovision)
 */
export function canManageTenant(role: GatePRole): boolean {
  return role === 'super_admin';
}

/**
 * Check if user can manage notification channels
 */
export function canManageChannels(role: GatePRole): boolean {
  return role === 'super_admin' || role === 'tenant_admin';
}

/**
 * Check if user can view tenant information
 */
export function canView(role: GatePRole): boolean {
  return role === 'super_admin' || role === 'tenant_admin' || role === 'tenant_viewer';
}

/**
 * Get user role from context (placeholder - integrate with your auth system)
 */
export function getUserRole(): GatePRole {
  // TODO: Integrate with actual RBAC system
  // For now, return super_admin for development
  return 'super_admin';
}
