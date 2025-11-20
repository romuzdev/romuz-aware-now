/**
 * useRole Hook
 * 
 * React hook for accessing user role information
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import type { AppRole, UserRole } from '../types';

/**
 * Role hook return type
 */
interface UseRoleReturn {
  role: AppRole | null;
  roles: UserRole[];
  isLoading: boolean;
  isPlatformAdmin: boolean;
  isPlatformSupport: boolean;
  isTenantAdmin: boolean;
  isTenantManager: boolean;
  isTenantEmployee: boolean;
  hasRole: (role: AppRole) => boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to get user role information
 */
export function useRole(): UseRoleReturn {
  const { user, tenantId } = useAppContext();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = async () => {
    if (!user?.id) {
      setRoles([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [user?.id]);

  // Get primary role (highest priority)
  const getPrimaryRole = (): AppRole | null => {
    if (roles.length === 0) return null;

    // Priority order
    const priorityOrder: AppRole[] = [
      'platform_admin',
      'platform_support',
      'tenant_admin',
      'tenant_manager',
      'tenant_employee',
    ];

    for (const role of priorityOrder) {
      const hasRole = roles.some((r) => r.role === role);
      if (hasRole) return role;
    }

    return roles[0].role;
  };

  const primaryRole = getPrimaryRole();

  // Check if user has specific role
  const hasRole = (role: AppRole): boolean => {
    return roles.some((r) => r.role === role);
  };

  return {
    role: primaryRole,
    roles,
    isLoading,
    isPlatformAdmin: hasRole('platform_admin'),
    isPlatformSupport: hasRole('platform_support'),
    isTenantAdmin: hasRole('tenant_admin'),
    isTenantManager: hasRole('tenant_manager'),
    isTenantEmployee: hasRole('tenant_employee'),
    hasRole,
    refresh: fetchRoles,
  };
}
