/**
 * Gate-K RBAC Guards
 * 
 * Role-based access control for Gate-K features
 */

export type GateKRole = "platform_admin" | "tenant_admin" | "analyst" | "manager" | "viewer";

/**
 * Check if user can generate quarterly insights
 * Allowed: analyst, tenant_admin, platform_admin
 */
export function canGenerateInsights(role: GateKRole): boolean {
  return ["analyst", "tenant_admin", "platform_admin"].includes(role);
}

/**
 * Check if user can export data
 * Allowed: all except viewer
 */
export function canExportData(role: GateKRole): boolean {
  return role !== "viewer";
}

/**
 * Check if user can generate recommendations
 * Allowed: analyst, tenant_admin, platform_admin
 */
export function canGenerateRecommendations(role: GateKRole): boolean {
  return ["analyst", "tenant_admin", "platform_admin"].includes(role);
}

/**
 * Check if user can modify KPI weights
 * Allowed: tenant_admin, platform_admin
 */
export function canModifyWeights(role: GateKRole): boolean {
  return ["tenant_admin", "platform_admin"].includes(role);
}

/**
 * Check if user has read-only access
 * All roles have at least read access
 */
export function canViewGateK(role: GateKRole): boolean {
  return true;
}
