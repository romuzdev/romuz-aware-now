/**
 * M18: Integration Settings Page
 * Manage external integrations (SIEM, Cloud Providers, Webhooks)
 */

import { useState } from 'react';
import { Plus, RefreshCw, Settings2, Plug, Cloud, Webhook, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useIntegrations,
  useIntegrationStats,
  useToggleIntegration,
  useDeleteIntegration,
  useVerifyIntegration,
  useTriggerSIEMSync,
} from '../hooks/useIntegrations';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateIntegrationDialog } from '../components/CreateIntegrationDialog';
import { EditIntegrationDialog } from '../components/EditIntegrationDialog';
import { IntegrationDetailsDialog } from '../components/IntegrationDetailsDialog';
import type { IncidentIntegration } from '@/integrations/external';

export function IntegrationSettings() {
  const [selectedIntegration, setSelectedIntegration] = useState<IncidentIntegration | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const { data: integrations = [], isLoading } = useIntegrations();
  const { data: stats } = useIntegrationStats();
  const toggleMutation = useToggleIntegration();
  const deleteMutation = useDeleteIntegration();
  const verifyMutation = useVerifyIntegration();
  const syncMutation = useTriggerSIEMSync();

  const filteredIntegrations = integrations.filter((i) => {
    if (filter === 'all') return true;
    return i.integration_type === filter;
  });

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'siem':
        return <Shield className="w-5 h-5" />;
      case 'cloud_provider':
        return <Cloud className="w-5 h-5" />;
      case 'webhook':
        return <Webhook className="w-5 h-5" />;
      default:
        return <Plug className="w-5 h-5" />;
    }
  };

  const handleToggle = async (integration: IncidentIntegration) => {
    await toggleMutation.mutateAsync({
      id: integration.id,
      is_active: !integration.is_active,
    });
  };

  const handleVerify = async (integration: IncidentIntegration) => {
    await verifyMutation.mutateAsync(integration.id);
  };

  const handleSync = async (integration: IncidentIntegration) => {
    await syncMutation.mutateAsync({
      integrationId: integration.id,
      windowMinutes: 15,
    });
  };

  const handleDelete = async () => {
    if (selectedIntegration) {
      await deleteMutation.mutateAsync(selectedIntegration.id);
      setShowDeleteDialog(false);
      setSelectedIntegration(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">إعدادات التكاملات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة التكاملات مع الأنظمة الخارجية (SIEM، Cloud Providers، Webhooks)
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة تكامل جديد
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التكاملات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_integrations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">التكاملات النشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active_integrations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">الأحداث المستلمة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_events_received.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">آخر 24 ساعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.events_last_24h}</div>
              <p className="text-xs text-muted-foreground">حدث</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">حوادث تم إنشاؤها</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.incidents_created_last_24h}
              </div>
              <p className="text-xs text-muted-foreground">آخر 24 ساعة</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integrations List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>التكاملات المكونة</CardTitle>
              <CardDescription>إدارة اتصالات الأنظمة الخارجية</CardDescription>
            </div>
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="siem">SIEM</TabsTrigger>
                <TabsTrigger value="cloud_provider">Cloud</TabsTrigger>
                <TabsTrigger value="webhook">Webhook</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIntegrations.length === 0 ? (
            <div className="text-center py-12">
              <Settings2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد تكاملات</h3>
              <p className="text-muted-foreground mb-4">
                ابدأ بإضافة تكامل جديد للاتصال بالأنظمة الخارجية
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة تكامل
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getIntegrationIcon(integration.integration_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{integration.integration_name}</h3>
                            {integration.is_active && (
                              <Badge variant="success">نشط</Badge>
                            )}
                            {!integration.is_active && (
                              <Badge variant="secondary">معطل</Badge>
                            )}
                            {integration.is_verified && (
                              <Badge variant="outline" className="text-green-600">
                                متحقق منه
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {integration.provider} • {integration.integration_type}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{integration.total_events_received} حدث</span>
                            {integration.last_event_at && (
                              <span>
                                آخر حدث:{' '}
                                {new Date(integration.last_event_at).toLocaleDateString('ar')}
                              </span>
                            )}
                            {integration.sync_status === 'syncing' && (
                              <Badge variant="outline" className="text-blue-600">
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                يتم المزامنة...
                              </Badge>
                            )}
                            {integration.sync_status === 'error' && (
                              <Badge variant="destructive">خطأ</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {integration.integration_type === 'siem' && integration.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(integration)}
                            disabled={syncMutation.isPending || integration.sync_status === 'syncing'}
                          >
                            <RefreshCw className="w-4 h-4 ml-2" />
                            مزامنة
                          </Button>
                        )}

                        {!integration.is_verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerify(integration)}
                            disabled={verifyMutation.isPending}
                          >
                            تحقق
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggle(integration)}
                          disabled={toggleMutation.isPending}
                        >
                          {integration.is_active ? 'تعطيل' : 'تفعيل'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setShowDetailsDialog(true);
                          }}
                        >
                          عرض
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setShowEditDialog(true);
                          }}
                        >
                          تعديل
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setShowDeleteDialog(true);
                          }}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateIntegrationDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}

      {showEditDialog && selectedIntegration && (
        <EditIntegrationDialog
          integration={selectedIntegration}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      {showDetailsDialog && selectedIntegration && (
        <IntegrationDetailsDialog
          integration={selectedIntegration}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التكامل؟ لن يتم استقبال أي أحداث من هذا المصدر بعد الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
