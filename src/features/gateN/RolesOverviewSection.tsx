import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Shield, Users } from 'lucide-react';
import { getRoleStats, PERMISSIONS } from '@/core/rbac';

const ROLE_INFO: Record<string, { label: string; description: string; color: string }> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Full system access',
    color: 'bg-destructive text-destructive-foreground',
  },
  tenant_admin: {
    label: 'Tenant Admin',
    description: 'Full tenant administration',
    color: 'bg-primary text-primary-foreground',
  },
  awareness_manager: {
    label: 'Awareness Manager',
    description: 'Manage awareness campaigns',
    color: 'bg-accent text-accent-foreground',
  },
  risk_manager: {
    label: 'Risk Manager',
    description: 'Manage risk assessments',
    color: 'bg-warning text-warning-foreground',
  },
  compliance_officer: {
    label: 'Compliance Officer',
    description: 'Manage compliance',
    color: 'bg-success text-success-foreground',
  },
  hr_manager: {
    label: 'HR Manager',
    description: 'Manage HR functions',
    color: 'bg-secondary text-secondary-foreground',
  },
  it_manager: {
    label: 'IT Manager',
    description: 'Manage IT infrastructure',
    color: 'bg-muted text-muted-foreground',
  },
  executive: {
    label: 'Executive',
    description: 'Executive dashboard access',
    color: 'bg-primary text-primary-foreground',
  },
  employee: {
    label: 'Employee',
    description: 'Basic user access',
    color: 'bg-muted text-muted-foreground',
  },
  // Legacy roles
  admin: {
    label: 'Admin (Legacy)',
    description: 'Legacy admin role',
    color: 'bg-primary text-primary-foreground',
  },
  manager: {
    label: 'Manager (Legacy)',
    description: 'Legacy manager role',
    color: 'bg-secondary text-secondary-foreground',
  },
  analyst: {
    label: 'Analyst (Legacy)',
    description: 'Legacy analyst role',
    color: 'bg-muted text-muted-foreground',
  },
  viewer: {
    label: 'Viewer (Legacy)',
    description: 'Legacy viewer role',
    color: 'bg-muted text-muted-foreground',
  },
};

export default function RolesOverviewSection() {
  const { t } = useTranslation();

  const { data: roleStats, isLoading } = useQuery({
    queryKey: ['role-stats'],
    queryFn: getRoleStats,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Get all roles (including those with 0 users)
  const allRoles = Object.keys(ROLE_INFO).map((role) => ({
    role,
    user_count: roleStats?.find((r) => r.role === role)?.user_count || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {allRoles.slice(0, 8).map((stat) => {
          const info = ROLE_INFO[stat.role];
          return (
            <Card key={stat.role}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <Badge className={info.color}>{info.label}</Badge>
                </div>
                <CardDescription className="text-xs">{info.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stat.user_count}</span>
                  <span className="text-sm text-muted-foreground">
                    {t('roleManagement.users')}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t('roleManagement.permissionsMatrix')}
          </CardTitle>
          <CardDescription>{t('roleManagement.permissionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(PERMISSIONS)
              .filter(([key]) => key.startsWith('route.'))
              .map(([permission, roles]) => {
                const rolesArray = Array.from(roles as readonly string[]);
                return (
                  <div
                    key={permission}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <span className="text-sm font-medium">
                      {permission.replace('route.', '')}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {rolesArray.slice(0, 4).map((role) => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {ROLE_INFO[role]?.label || role}
                        </Badge>
                      ))}
                      {rolesArray.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{rolesArray.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
