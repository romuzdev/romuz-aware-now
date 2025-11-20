import { Navigate } from 'react-router-dom';
import { useRBAC } from '@/core/rbac';
import { Permission } from '@/core/rbac/integration/rbac.integration';
import { useTranslation } from 'react-i18next';

interface RoleGuardProps {
  children: JSX.Element;
  requiredPermission: Permission;
  fallbackPath?: string;
}

/**
 * Gate-U: Role-Based Access Control Guard
 * 
 * Protects routes by checking if the user has the required permission.
 * Redirects to unauthorized page if user lacks permission.
 */
export default function RoleGuard({
  children,
  requiredPermission,
  fallbackPath = '/unauthorized',
}: RoleGuardProps) {
  const { can, isLoading } = useRBAC(requiredPermission);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">
          {t('roleGuard.loading')}
        </div>
      </div>
    );
  }

  if (!can) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
