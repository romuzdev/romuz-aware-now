/**
 * RBAC System
 * 
 * Role-Based Access Control with database-driven permissions
 */

// Types
export * from './types';

// Roles
export * from './roles';

// Permissions
export * from './permissions';

// Hooks
export * from './hooks';

// Integration
export { 
  hasRole, 
  getUserRoles, 
  fetchMyRoles, 
  rolesHavePermission, 
  getPermissionsForRoles,
  getUsersWithRoles,
  assignRole,
  removeRole,
  getRoleStats,
  PERMISSIONS,
  type AppRole,
  type Permission,
  type UserWithRoles,
} from './integration';
