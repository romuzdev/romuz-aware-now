// Gate-F: RBAC Hook with server-side validation
import { useQuery } from '@tanstack/react-query';
import { fetchMyRoles, rolesHavePermission } from '../integration/rbac.integration';

export function useRBAC(permission: string) {
  // Fetch current user's roles from database
  const { data: roles, isLoading } = useQuery({
    queryKey: ['my-roles'],
    queryFn: fetchMyRoles,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const can = rolesHavePermission(roles ?? [], permission);

  return { can, isLoading, roles: roles ?? [] };
}
