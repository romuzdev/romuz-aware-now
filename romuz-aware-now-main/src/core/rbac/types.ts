/**
 * RBAC Types
 * 
 * TypeScript types for Role-Based Access Control system
 */

// Import AppRole from integration module
import type { AppRole as RbacAppRole } from './integration/rbac.integration';

/**
 * App Role - Re-export from integration module
 */
export type AppRole = RbacAppRole;

/**
 * Role Level - For hierarchical permission checking
 */
export type RoleLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Permission - Granular permission string
 * Format: "resource.action" or "app.resource.action"
 */
export type Permission = string;

/**
 * User Role Record - From database
 */
export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  tenant_id: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

/**
 * Role Definition
 */
export interface RoleDefinition {
  role: AppRole;
  name: string;
  nameAr: string;
  description: string;
  level: RoleLevel;
  isPlatform: boolean;
  permissions: Permission[];
}

/**
 * Permission Check Result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * RBAC Context
 */
export interface RBACContext {
  userId: string | null;
  role: AppRole | null;
  tenantId: string | null;
  permissions: Permission[];
  isLoading: boolean;
}
