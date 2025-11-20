/**
 * Role Definitions
 * 
 * Central registry of all roles and their permissions
 */

import type { AppRole, RoleDefinition, RoleLevel } from './types';

/**
 * Role Hierarchy Levels
 * Lower number = higher privilege
 */
export const ROLE_LEVELS: Record<AppRole, RoleLevel> = {
  platform_admin: 1,
  platform_support: 2,
  super_admin: 1,
  tenant_admin: 3,
  tenant_manager: 4,
  tenant_employee: 5,
  awareness_manager: 4,
  risk_manager: 4,
  compliance_officer: 4,
  hr_manager: 4,
  it_manager: 4,
  executive: 3,
  employee: 5,
  // Legacy roles
  admin: 3,
  analyst: 4,
  manager: 4,
  viewer: 5,
};

/**
 * Check if role1 has higher or equal privilege than role2
 */
export function hasHigherOrEqualRole(role1: AppRole, role2: AppRole): boolean {
  return ROLE_LEVELS[role1] <= ROLE_LEVELS[role2];
}

/**
 * Platform Admin Role
 */
const PLATFORM_ADMIN: RoleDefinition = {
  role: 'platform_admin',
  name: 'Platform Administrator',
  nameAr: 'مدير المنصة',
  description: 'Full platform access',
  level: 1,
  isPlatform: true,
  permissions: ['*'], // Wildcard = all permissions
};

/**
 * Platform Support Role
 */
const PLATFORM_SUPPORT: RoleDefinition = {
  role: 'platform_support',
  name: 'Platform Support',
  nameAr: 'الدعم الفني',
  description: 'Platform support and monitoring',
  level: 2,
  isPlatform: true,
  permissions: [
    'platform.view',
    'platform.support',
    'tenants.view',
    'users.view',
    'audit.view',
  ],
};

/**
 * Tenant Admin Role
 */
const TENANT_ADMIN: RoleDefinition = {
  role: 'tenant_admin',
  name: 'Tenant Administrator',
  nameAr: 'مدير الجهة',
  description: 'Full tenant access',
  level: 3,
  isPlatform: false,
  permissions: [
    'tenant.*',
    'campaigns.*',
    'documents.*',
    'users.manage',
    'roles.manage',
    'settings.manage',
    'reports.view',
    'audit.view',
  ],
};

/**
 * Tenant Manager Role
 */
const TENANT_MANAGER: RoleDefinition = {
  role: 'tenant_manager',
  name: 'Manager',
  nameAr: 'مدير',
  description: 'Manage campaigns and content',
  level: 4,
  isPlatform: false,
  permissions: [
    'campaigns.view',
    'campaigns.create',
    'campaigns.edit',
    'campaigns.delete',
    'campaigns.manage',
    'documents.view',
    'documents.create',
    'documents.edit',
    'reports.view',
  ],
};

/**
 * Tenant Employee Role
 */
const TENANT_EMPLOYEE: RoleDefinition = {
  role: 'tenant_employee',
  name: 'Employee',
  nameAr: 'موظف',
  description: 'View-only access',
  level: 5,
  isPlatform: false,
  permissions: [
    'campaigns.view',
    'documents.view',
  ],
};

/**
 * All Role Definitions
 */
export const ROLE_DEFINITIONS: Record<AppRole, RoleDefinition> = {
  platform_admin: PLATFORM_ADMIN,
  platform_support: PLATFORM_SUPPORT,
  tenant_admin: TENANT_ADMIN,
  tenant_manager: TENANT_MANAGER,
  tenant_employee: TENANT_EMPLOYEE,
  // Define other roles with basic permissions
  super_admin: PLATFORM_ADMIN, // Same as platform_admin
  awareness_manager: TENANT_MANAGER, // Same permissions as tenant_manager
  risk_manager: TENANT_MANAGER,
  compliance_officer: TENANT_MANAGER,
  hr_manager: TENANT_MANAGER,
  it_manager: TENANT_MANAGER,
  executive: TENANT_ADMIN, // High-level access like tenant_admin
  employee: TENANT_EMPLOYEE, // Same as tenant_employee
  // Legacy roles
  admin: TENANT_ADMIN,
  analyst: TENANT_MANAGER,
  manager: TENANT_MANAGER,
  viewer: TENANT_EMPLOYEE,
};

/**
 * Get role definition
 */
export function getRoleDefinition(role: AppRole): RoleDefinition {
  return ROLE_DEFINITIONS[role];
}

/**
 * Get role permissions
 */
export function getRolePermissions(role: AppRole): string[] {
  return ROLE_DEFINITIONS[role].permissions;
}

/**
 * Check if role is platform role
 */
export function isPlatformRole(role: AppRole): boolean {
  return ROLE_DEFINITIONS[role].isPlatform;
}

/**
 * Get all tenant roles
 */
export function getTenantRoles(): AppRole[] {
  return Object.keys(ROLE_DEFINITIONS).filter(
    (role) => !ROLE_DEFINITIONS[role as AppRole].isPlatform
  ) as AppRole[];
}

/**
 * Get all platform roles
 */
export function getPlatformRoles(): AppRole[] {
  return Object.keys(ROLE_DEFINITIONS).filter(
    (role) => ROLE_DEFINITIONS[role as AppRole].isPlatform
  ) as AppRole[];
}
