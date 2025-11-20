/**
 * M15 - Integrations Page
 * 
 * مركز إدارة التكاملات مع الأنظمة الخارجية
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  IntegrationMarketplace,
  IntegrationHealthMonitor,
  SyncJobsManager,
  ConnectorSetupModal,
  TeamsConfigModal,
} from '@/modules/integrations/components';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createConnector, 
} from '@/modules/integrations/integration/connectors.integration';
import {
  testConnectorConnection,
  getIntegrationHealthSummary,
} from '@/modules/integrations/integration/health-monitor.integration';
import type { CreateConnectorInput } from '@/modules/integrations/types';
import { toast } from 'sonner';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plug,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export default function IntegrationsPage() {
  const { t, i18n } = useTranslation();
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  // State for modals
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [teamsModalOpen, setTeamsModalOpen] = useState(false);
  const [selectedConnectorType, setSelectedConnectorType] = useState<string>('');
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>('');

  // Get health summary for overview stats
  const { data: healthSummary } = useQuery({
    queryKey: ['integration-health-summary', tenantId],
    queryFn: () => getIntegrationHealthSummary(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 30000,
  });

  // Create connector mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateConnectorInput) => 
      createConnector(tenantId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['integration-health', tenantId] });
      toast.success(
        isRTL ? 'تم إنشاء التكامل بنجاح' : 'Integration created successfully'
      );
      setSetupModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(
        isRTL 
          ? `فشل في إنشاء التكامل: ${error.message}`
          : `Failed to create integration: ${error.message}`
      );
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (connectorId: string) => 
      testConnectorConnection(tenantId!, connectorId),
    onSuccess: (result: { success: boolean; message?: string }) => {
      if (result.success) {
        toast.success(
          isRTL ? 'الاتصال ناجح' : 'Connection successful'
        );
      } else {
        toast.error(
          isRTL ? `فشل الاتصال: ${result.message || ''}` : `Connection failed: ${result.message || ''}`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(
        isRTL 
          ? `خطأ في الاتصال: ${error.message}`
          : `Connection error: ${error.message}`
      );
    },
  });

  // Handlers
  const handleInstall = (connectorType: string) => {
    setSelectedConnectorType(connectorType);
    
    // Open specific modal based on type
    if (connectorType === 'teams') {
      setTeamsModalOpen(true);
    } else {
      setSetupModalOpen(true);
    }
  };

  const handleConfigure = (connectorId: string) => {
    setSelectedConnectorId(connectorId);
    // TODO: Open edit modal with connector data
    setSetupModalOpen(true);
  };

  const handleViewDetails = (connectorId: string) => {
    setSelectedConnectorId(connectorId);
    // Show details in a dialog or navigate to details page
  };

  const handleTestConnection = (connectorId: string) => {
    testConnectionMutation.mutate(connectorId);
  };

  const handleCreateConnector = async (input: CreateConnectorInput) => {
    await createMutation.mutateAsync(input);
  };

  return (
    <div className="container mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Plug className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isRTL ? 'التكاملات' : 'Integrations'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL 
                ? 'إدارة التكاملات مع الأنظمة الخارجية والخدمات السحابية'
                : 'Manage integrations with external systems and cloud services'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {healthSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'تكاملات نشطة' : 'Active Integrations'}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthSummary.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {healthSummary.healthy || 0} {isRTL ? 'سليم' : 'healthy'}
                </Badge>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'الصحة العامة' : 'Health Status'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthSummary.healthy === healthSummary.total ? (
                  <span className="text-green-500">
                    {isRTL ? 'ممتاز' : 'Excellent'}
                  </span>
                ) : healthSummary.error > 0 ? (
                  <span className="text-red-500">
                    {isRTL ? 'تحذير' : 'Warning'}
                  </span>
                ) : (
                  <span className="text-yellow-500">
                    {isRTL ? 'جيد' : 'Good'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'الحالة الإجمالية' : 'Overall status'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'تحذيرات' : 'Warnings'}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {healthSummary.warning || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'يحتاج انتباه' : 'Needs attention'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'أخطاء' : 'Errors'}
              </CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {healthSummary.error || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'بحاجة لإصلاح' : 'Requires fixing'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="marketplace" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace" className="gap-2">
            <Plug className="h-4 w-4" />
            {isRTL ? 'المتجر' : 'Marketplace'}
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Activity className="h-4 w-4" />
            {isRTL ? 'الصحة' : 'Health'}
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {isRTL ? 'المزامنة' : 'Sync Jobs'}
          </TabsTrigger>
        </TabsList>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {isRTL ? 'متجر التكاملات' : 'Integration Marketplace'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? 'استكشف وثبّت التكاملات المتاحة مع الأنظمة الخارجية'
                  : 'Explore and install available integrations with external systems'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationMarketplace
                onInstall={handleInstall}
                onConfigure={handleConfigure}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Monitor Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {isRTL ? 'مراقبة الصحة' : 'Health Monitor'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? 'راقب حالة وأداء التكاملات المثبتة'
                  : 'Monitor the status and performance of installed integrations'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationHealthMonitor
                onViewDetails={handleViewDetails}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Jobs Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {isRTL ? 'وظائف المزامنة' : 'Sync Jobs'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? 'إدارة جداول المزامنة وعرض السجل التاريخي'
                  : 'Manage sync schedules and view historical logs'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SyncJobsManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ConnectorSetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        onSubmit={handleCreateConnector}
      />

      <TeamsConfigModal
        open={teamsModalOpen}
        onOpenChange={(open) => setTeamsModalOpen(open)}
        onSuccess={() => {
          setTeamsModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] });
          queryClient.invalidateQueries({ queryKey: ['integration-health', tenantId] });
        }}
      />
    </div>
  );
}
