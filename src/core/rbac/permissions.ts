/**
 * Permission Utilities
 * 
 * Helper functions for permission checking and validation
 */

import type { Permission, AppRole } from './types';
import { getRolePermissions } from './roles';

/**
 * Check if permission matches pattern
 * Supports wildcards: "campaigns.*" matches "campaigns.view", "campaigns.edit", etc.
 */
export function matchesPermission(
  userPermission: string,
  requiredPermission: string
): boolean {
  // Exact match
  if (userPermission === requiredPermission) {
    return true;
  }

  // Wildcard match (e.g., "*" or "campaigns.*")
  if (userPermission.endsWith('*')) {
    const prefix = userPermission.slice(0, -1);
    return requiredPermission.startsWith(prefix);
  }

  return false;
}

/**
 * Check if user has permission
 */
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  // Check if any user permission matches the required permission
  return userPermissions.some((p) => matchesPermission(p, requiredPermission));
}

/**
 * Check if user has all permissions
 */
export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((required) =>
    hasPermission(userPermissions, required)
  );
}

/**
 * Check if user has any of the permissions
 */
export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((required) =>
    hasPermission(userPermissions, required)
  );
}

/**
 * Get permissions for role
 */
export function getPermissionsForRole(role: AppRole): Permission[] {
  return getRolePermissions(role);
}

/**
 * Expand wildcard permissions
 * Converts "campaigns.*" to all campaign permissions
 */
export function expandPermissions(
  permissions: Permission[],
  availablePermissions: Permission[]
): Permission[] {
  const expanded = new Set<Permission>();

  for (const permission of permissions) {
    if (permission === '*') {
      // Full access
      return availablePermissions;
    }

    if (permission.endsWith('*')) {
      // Wildcard permission
      const prefix = permission.slice(0, -1);
      const matched = availablePermissions.filter((p) => p.startsWith(prefix));
      matched.forEach((p) => expanded.add(p));
    } else {
      // Regular permission
      expanded.add(permission);
    }
  }

  return Array.from(expanded);
}

/**
 * Permission categories for organization
 */
export const PERMISSION_CATEGORIES = {
  platform: {
    name: 'Platform',
    nameAr: 'المنصة',
    permissions: ['platform.view', 'platform.manage', 'platform.support'],
  },
  tenants: {
    name: 'Tenants',
    nameAr: 'الجهات',
    permissions: ['tenants.view', 'tenants.manage', 'tenants.delete'],
  },
  campaigns: {
    name: 'Campaigns',
    nameAr: 'الحملات',
    permissions: [
      'campaigns.view',
      'campaigns.create',
      'campaigns.edit',
      'campaigns.delete',
      'campaigns.manage',
    ],
  },
  documents: {
    name: 'Documents',
    nameAr: 'المستندات',
    permissions: [
      'documents.view',
      'documents.create',
      'documents.edit',
      'documents.delete',
    ],
  },
  users: {
    name: 'Users',
    nameAr: 'المستخدمين',
    permissions: ['users.view', 'users.create', 'users.edit', 'users.manage'],
  },
  roles: {
    name: 'Roles',
    nameAr: 'الأدوار',
    permissions: ['roles.view', 'roles.manage'],
  },
  settings: {
    name: 'Settings',
    nameAr: 'الإعدادات',
    permissions: ['settings.view', 'settings.manage'],
  },
  reports: {
    name: 'Reports',
    nameAr: 'التقارير',
    permissions: ['reports.view', 'reports.export'],
  },
  audit: {
    name: 'Audit Log',
    nameAr: 'سجل المراجعة',
    permissions: ['audit.view', 'audit.export'],
  },
} as const;

/**
 * Get all available permissions
 */
export function getAllPermissions(): Permission[] {
  return Object.values(PERMISSION_CATEGORIES).flatMap(
    (category) => category.permissions
  );
}
