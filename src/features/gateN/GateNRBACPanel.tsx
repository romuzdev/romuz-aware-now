/**
 * Gate-N RBAC Panel (N3)
 * Roles & Permissions Management
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Shield, Info, Users, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RolesOverviewSection from './RolesOverviewSection';
import RoleManagementSection from './RoleManagementSection';

export default function GateNRBACPanel() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Info: Settings moved to Gate-P */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>{t('roleManagement.note')}:</strong> {t('roleManagement.noteMessage')}{' '}
          <a href="/admin/gate-p" className="font-semibold text-primary hover:underline">
            Gate-P Console
          </a>
          {' '}→ Tenant Configuration. {t('roleManagement.requiresSuperAdmin')}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">{t('roleManagement.overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('roleManagement.management')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <RolesOverviewSection />
        </TabsContent>

        <TabsContent value="management" className="mt-6">
          <RoleManagementSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
