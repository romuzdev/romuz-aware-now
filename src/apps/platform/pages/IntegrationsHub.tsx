/**
 * Integrations Hub Page
 * Gate-M15: External Systems Integration Management
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Plus, Settings, Activity, AlertCircle, CheckCircle, Power, Webhook, Key, FileText } from 'lucide-react';
import { fetchConnectors, createConnector } from '@/modules/integrations/integration';
import type { IntegrationConnector, CreateConnectorInput } from '@/modules/integrations';
import { toast } from 'sonner';
import { ConnectorSetupModal } from '@/modules/integrations/components/ConnectorSetupModal';
import { WebhookManager } from '@/modules/integrations/components/WebhookManager';
import { APIKeyManager } from '@/modules/integrations/components/APIKeyManager';
import { IntegrationLogs } from '@/modules/integrations/components/IntegrationLogs';
import { IntegrationMarketplace } from '@/modules/integrations/components/IntegrationMarketplace';
import { IntegrationHealthMonitor } from '@/modules/integrations/components/IntegrationHealthMonitor';
import { SyncJobsManager } from '@/modules/integrations/components/SyncJobsManager';
import { TeamsConfigModal } from '@/modules/integrations/components/TeamsConfigModal';
import { useRBAC } from '@/core/rbac';

export default function IntegrationsHubPage() {
  const { t } = useTranslation();
  const { tenantId } = useAppContext();
  const { can: canManage } = useRBAC('integrations.manage');
  const { can: canViewLogs } = useRBAC('integrations.logs.view');
  const [connectors, setConnectors] = useState<IntegrationConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<IntegrationConnector | undefined>(undefined);

  useEffect(() => {
    document.title = `${t('integrations.hub')} | Romuz`;
  }, [t]);

  useEffect(() => {
    loadConnectors();
  }, [tenantId]);

  const loadConnectors = async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await fetchConnectors(tenantId);
      setConnectors(data);
    } catch (error: any) {
      toast.error('فشل تحميل التكاملات', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnector = async (input: CreateConnectorInput) => {
    if (!tenantId) return;
    
    try {
      await createConnector(tenantId, input);
      toast.success('تم إنشاء التكامل بنجاح');
      loadConnectors();
      setIsSetupModalOpen(false);
    } catch (error: any) {
      toast.error('فشل إنشاء التكامل', {
        description: error.message,
      });
      throw error;
    }
  };

  const handleInstallConnector = (connectorType: string) => {
    if (connectorType === 'teams') {
      setIsTeamsModalOpen(true);
    } else {
      setIsSetupModalOpen(true);
    }
  };

  const handleConfigureConnector = (connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId);
    if (connector?.type === 'teams') {
      setSelectedConnector(connector);
      setIsTeamsModalOpen(true);
    } else {
      // Handle other connector types
      toast.info('إعدادات هذا التكامل قريباً');
    }
  };

  const getConnectorIcon = (type: string) => {
    const icons: Record<string, string> = {
      slack: '💬',
      google_workspace: '📁',
      odoo: '📊',
      webhook: '🔗',
      api: '🌐',
      custom: '⚙️',
    };
    return icons[type] || '🔌';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default', label: 'نشط' },
      inactive: { variant: 'secondary', label: 'غير نشط' },
      error: { variant: 'destructive', label: 'خطأ' },
      testing: { variant: 'outline', label: 'اختبار' },
    };
    
    const config = variants[status] || { variant: 'secondary', label: status };
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: connectors.length,
    active: connectors.filter(c => c.status === 'active').length,
    inactive: connectors.filter(c => c.status === 'inactive').length,
    error: connectors.filter(c => c.status === 'error').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <p className="text-lg text-muted-foreground">لم يتم العثور على معرف الجهة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            مركز التكاملات
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة الاتصال مع الأنظمة الخارجية والخدمات
          </p>
        </div>
        {canManage && (
          <Button size="lg" onClick={() => setIsSetupModalOpen(true)}>
            <Plus className="h-5 w-5 ml-2" />
            إضافة تكامل جديد
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي التكاملات</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نشط</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gray-500/10">
              <Power className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">غير نشط</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">أخطاء</p>
              <p className="text-2xl font-bold text-red-600">{stats.error}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="marketplace">
            <Settings className="h-4 w-4 ml-2" />
            السوق
          </TabsTrigger>
          <TabsTrigger value="connectors">
            <Power className="h-4 w-4 ml-2" />
            التكاملات المثبتة
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 ml-2" />
            مراقبة الصحة
          </TabsTrigger>
          <TabsTrigger value="sync">
            <CheckCircle className="h-4 w-4 ml-2" />
            المزامنة
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 ml-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="h-4 w-4 ml-2" />
            API Keys
          </TabsTrigger>
          {canViewLogs && (
            <TabsTrigger value="logs">
              <FileText className="h-4 w-4 ml-2" />
              السجلات
            </TabsTrigger>
          )}
        </TabsList>

        {/* Marketplace Tab - NEW */}
        <TabsContent value="marketplace" className="space-y-6">
          <IntegrationMarketplace
            onInstall={handleInstallConnector}
            onConfigure={handleConfigureConnector}
          />
        </TabsContent>

        {/* Connectors Tab */}
        <TabsContent value="connectors" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي التكاملات</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نشط</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gray-500/10">
                  <Power className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">غير نشط</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">أخطاء</p>
                  <p className="text-2xl font-bold text-red-600">{stats.error}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Connectors Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : connectors.length === 0 ? (
            <Card className="p-12 text-center">
              <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد تكاملات بعد</h3>
              <p className="text-muted-foreground mb-6">
                ابدأ بإضافة تكامل جديد للاتصال مع الأنظمة الخارجية
              </p>
              <Button size="lg" onClick={() => setIsSetupModalOpen(true)}>
                <Plus className="h-5 w-5 ml-2" />
                إضافة أول تكامل
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectors.map((connector) => (
                <Card key={connector.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{getConnectorIcon(connector.type)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{connector.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {connector.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(connector.status)}
                  </div>

                  {connector.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {connector.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Activity className="h-4 w-4" />
                    {connector.last_sync_at ? (
                      <span>آخر مزامنة: {new Date(connector.last_sync_at).toLocaleString('ar')}</span>
                    ) : (
                      <span>لم تتم المزامنة بعد</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 ml-1" />
                      إعدادات
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Activity className="h-4 w-4 ml-1" />
                      السجلات
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Health Monitor Tab - NEW */}
        <TabsContent value="health">
          <IntegrationHealthMonitor onViewDetails={handleConfigureConnector} />
        </TabsContent>

        {/* Sync Jobs Tab - NEW */}
        <TabsContent value="sync">
          <SyncJobsManager />
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks">
          <WebhookManager />
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <APIKeyManager />
        </TabsContent>

        {/* Logs Tab */}
        {canViewLogs && (
          <TabsContent value="logs">
            <IntegrationLogs />
          </TabsContent>
        )}
      </Tabs>

      {/* Setup Modals */}
      <ConnectorSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSubmit={handleCreateConnector}
      />

      <TeamsConfigModal
        open={isTeamsModalOpen}
        onOpenChange={(open) => {
          setIsTeamsModalOpen(open);
          if (!open) setSelectedConnector(undefined);
        }}
        connector={selectedConnector}
        onSuccess={() => {
          loadConnectors();
          setIsTeamsModalOpen(false);
          setSelectedConnector(undefined);
        }}
      />
    </div>
  );
}
