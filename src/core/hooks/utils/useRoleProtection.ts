/**
 * Role-Based Protection Hook
 * 
 * Replaces password-based protection with RBAC system.
 * Checks if user has required role before allowing sensitive actions.
 * 
 * SECURITY: This is part of the fix for hardcoded password vulnerability.
 * Date: 2025-11-17
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/core/rbac/hooks/useRole';
import type { AppRole } from '@/core/rbac/types';

interface UseRoleProtectionOptions {
  requiredRole: AppRole;
  onSuccess?: () => void;
  onFailure?: () => void;
}

interface UseRoleProtectionResult {
  showDialog: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  setShowDialog: (show: boolean) => void;
  checkAuthorization: () => boolean;
  executeProtectedAction: (action: () => void | Promise<void>) => Promise<void>;
}

/**
 * Hook to protect sensitive actions with role-based authorization
 * 
 * @param options Configuration object with required role and callbacks
 * @returns Object with authorization state and methods
 * 
 * @example
 * ```tsx
 * const roleProtection = useRoleProtection({ 
 *   requiredRole: 'platform_admin',
 *   onFailure: () => console.log('Access denied')
 * });
 * 
 * const handleSensitiveAction = async () => {
 *   await roleProtection.executeProtectedAction(async () => {
 *     // Your sensitive action here
 *     await performDangerousOperation();
 *   });
 * };
 * ```
 */
export function useRoleProtection(
  options: UseRoleProtectionOptions
): UseRoleProtectionResult {
  const { requiredRole, onSuccess, onFailure } = options;
  const { toast } = useToast();
  const { roles, isLoading, hasRole } = useRole();
  const [showDialog, setShowDialog] = useState(false);

  // Check if user is authorized
  const isAuthorized = hasRole(requiredRole);

  const checkAuthorization = useCallback((): boolean => {
    if (isLoading) {
      toast({
        title: 'جاري التحميل',
        description: 'الرجاء الانتظار...',
        variant: 'default',
      });
      return false;
    }

    if (!isAuthorized) {
      toast({
        title: 'غير مصرح',
        description: `هذا الإجراء يتطلب دور: ${requiredRole}`,
        variant: 'destructive',
      });
      onFailure?.();
      return false;
    }

    onSuccess?.();
    return true;
  }, [isLoading, isAuthorized, requiredRole, toast, onSuccess, onFailure]);

  const executeProtectedAction = useCallback(
    async (action: () => void | Promise<void>) => {
      if (!checkAuthorization()) {
        return;
      }

      try {
        await action();
      } catch (error) {
        console.error('Protected action failed:', error);
        toast({
          title: 'فشل الإجراء',
          description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
          variant: 'destructive',
        });
      }
    },
    [checkAuthorization, toast]
  );

  return {
    showDialog,
    isAuthorized,
    isLoading,
    setShowDialog,
    checkAuthorization,
    executeProtectedAction,
  };
}

/**
 * Simplified hook for platform admin actions
 */
export function usePlatformAdminProtection(): UseRoleProtectionResult {
  return useRoleProtection({ 
    requiredRole: 'platform_admin',
  });
}
