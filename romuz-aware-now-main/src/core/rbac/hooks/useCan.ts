/**
 * useCan Hook
 * 
 * React hook for permission checking
 */

import { useCallback, useMemo } from 'react';
import { useRole } from './useRole';
import { hasPermission, hasAllPermissions, hasAnyPermission } from '../permissions';
import { getRolePermissions } from '../roles';
import type { Permission } from '../types';

/**
 * Can hook return type
 */
export type CanFunction = (permission: Permission) => boolean;

interface UseCanReturn {
  can: CanFunction;
  canAll: (permissions: Permission[]) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  permissions: Permission[];
  isLoading: boolean;
}

/**
 * Hook to check user permissions
 */
export function useCan(): CanFunction {
  const { role, isLoading } = useRole();

  return useCallback(
    (permission: Permission) => {
      if (isLoading) return false;
      if (!role) return false;

      const userPermissions = getRolePermissions(role);
      return hasPermission(userPermissions, permission);
    },
    [role, isLoading]
  );
}

/**
 * Enhanced hook with multiple permission checks
 */
export function usePermissions(): UseCanReturn {
  const { role, isLoading } = useRole();

  const permissions = useMemo(() => {
    if (!role) return [];
    return getRolePermissions(role);
  }, [role]);

  const can = useCallback(
    (permission: Permission) => {
      if (isLoading) return false;
      return hasPermission(permissions, permission);
    },
    [permissions, isLoading]
  );

  const canAll = useCallback(
    (requiredPermissions: Permission[]) => {
      if (isLoading) return false;
      return hasAllPermissions(permissions, requiredPermissions);
    },
    [permissions, isLoading]
  );

  const canAny = useCallback(
    (requiredPermissions: Permission[]) => {
      if (isLoading) return false;
      return hasAnyPermission(permissions, requiredPermissions);
    },
    [permissions, isLoading]
  );

  return {
    can,
    canAll,
    canAny,
    permissions,
    isLoading,
  };
}
