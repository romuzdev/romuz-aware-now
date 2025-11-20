/**
 * Permission Gate Component
 * 
 * Conditionally renders children based on user permissions
 */

import { useRBAC } from '@/core/rbac';
import type { Permission } from '@/core/rbac/integration/rbac.integration';

interface PermissionGateProps {
  children: React.ReactNode;
  permission: Permission;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

/**
 * Gate component that shows/hides content based on permissions
 */
export function PermissionGate({
  children,
  permission,
  fallback = null,
  showLoading = false,
}: PermissionGateProps) {
  const { can, isLoading } = useRBAC(permission);

  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!can) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook version for programmatic checks
 */
export function usePermission(permission: Permission) {
  return useRBAC(permission);
}
