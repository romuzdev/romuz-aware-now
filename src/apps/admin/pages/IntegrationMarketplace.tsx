/**
 * M15 - Integration Marketplace
 * Central hub for managing all integrations
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Search, Plus, Activity } from 'lucide-react';
import { ConnectorCard } from '@/modules/integrations/components/ConnectorCard';
import { IntegrationHealthMonitor } from '@/modules/integrations/components/IntegrationHealthMonitor';
import { SyncJobsManager } from '@/modules/integrations/components/SyncJobsManager';
import { IntegrationLogsViewer } from '@/modules/integrations/components/IntegrationLogsViewer';
import { WebhookManager } from '@/modules/integrations/components/WebhookManager';
import { ConnectorConfigWizard } from '@/modules/integrations/components/ConnectorConfigWizard';
import { useIntegrationHealth } from '@/modules/integrations/hooks';

export default function IntegrationMarketplace() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { data: healthData } = useIntegrationHealth();

  // Available integrations
  const availableIntegrations: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    status: 'available' | 'configured' | 'active' | 'error';
    category: string;
  }> = [
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'دمج كامل مع Microsoft Teams للإشعارات والمزامنة',
      icon: '🔷',
      status: 'available',
      category: 'communication',
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'مزامنة الملفات والمستندات مع Google Drive',
      icon: '📁',
      status: 'configured',
      category: 'storage',
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'إرسال الإشعارات والتنبيهات عبر Slack',
      icon: '💬',
      status: 'configured',
      category: 'communication',
    },
    {
      id: 'odoo',
      name: 'Odoo ERP',
      description: 'ربط البيانات مع نظام Odoo',
      icon: '🔧',
      status: 'available',
      category: 'erp',
    },
  ];

  const filteredIntegrations = availableIntegrations.filter(integration =>
    integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.description.includes(searchQuery)
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('integrations.marketplace.title', 'سوق التكاملات')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('integrations.marketplace.description', 'إدارة ومراقبة جميع التكاملات الخارجية')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsWizardOpen(true)}>
            <Plus className="h-4 w-4 me-2" />
            {t('integrations.add', 'إضافة تكامل')}
          </Button>
          <Button variant="default" size="sm">
            <Activity className="h-4 w-4 me-2" />
            {t('integrations.health', 'حالة الصحة')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('integrations.search', 'ابحث عن التكاملات...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pe-10"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList>
          <TabsTrigger value="marketplace">
            {t('integrations.tabs.marketplace', 'السوق')}
          </TabsTrigger>
          <TabsTrigger value="health">
            {t('integrations.tabs.health', 'المراقبة')}
          </TabsTrigger>
          <TabsTrigger value="sync">
            {t('integrations.tabs.sync', 'المزامنة')}
          </TabsTrigger>
          <TabsTrigger value="logs">
            {t('integrations.tabs.logs', 'السجلات')}
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            {t('integrations.tabs.webhooks', 'Webhooks')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIntegrations.map(integration => (
              <ConnectorCard key={integration.id} integration={integration} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="health">
          <IntegrationHealthMonitor />
        </TabsContent>

        <TabsContent value="sync">
          <SyncJobsManager />
        </TabsContent>

        <TabsContent value="logs">
          <IntegrationLogsViewer />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookManager />
        </TabsContent>
      </Tabs>

      {/* Configuration Wizard */}
      <ConnectorConfigWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={async () => {}}
      />
    </div>
  );
}
