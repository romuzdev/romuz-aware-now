/**
 * M18: Integration Settings Page
 * Manage external integrations (SIEM, Cloud Providers, Webhooks)
 */

import { useState } from 'react';
import { Plus, RefreshCw, Settings2, Plug, Cloud, Webhook, Shield } from 'lucide-react';
import {
  useIntegrations,
  useIntegrationStats,
  useToggleIntegration,
  useDeleteIntegration,
  useVerifyIntegration,
  useTriggerSIEMSync,
} from '../hooks/useIntegrations';
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
        <div className="h-32 w-full bg-muted animate-pulse rounded-lg" />
        <div className="h-96 w-full bg-muted animate-pulse rounded-lg" />
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
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          إضافة تكامل جديد
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">إجمالي التكاملات</h3>
            <div className="text-2xl font-bold">{stats.total_integrations}</div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">التكاملات النشطة</h3>
            <div className="text-2xl font-bold text-green-600">{stats.active_integrations}</div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">الأحداث المستلمة</h3>
            <div className="text-2xl font-bold">{stats.total_events_received.toLocaleString()}</div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">آخر 24 ساعة</h3>
            <div className="text-2xl font-bold">{stats.events_last_24h}</div>
            <p className="text-xs text-muted-foreground">حدث</p>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">حوادث تم إنشاؤها</h3>
            <div className="text-2xl font-bold text-orange-600">
              {stats.incidents_created_last_24h}
            </div>
            <p className="text-xs text-muted-foreground">آخر 24 ساعة</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 ${filter === 'all' ? 'border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
        >
          الكل
        </button>
        <button
          onClick={() => setFilter('siem')}
          className={`px-4 py-2 ${filter === 'siem' ? 'border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
        >
          SIEM
        </button>
        <button
          onClick={() => setFilter('cloud_provider')}
          className={`px-4 py-2 ${filter === 'cloud_provider' ? 'border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
        >
          Cloud
        </button>
        <button
          onClick={() => setFilter('webhook')}
          className={`px-4 py-2 ${filter === 'webhook' ? 'border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
        >
          Webhook
        </button>
      </div>

      {/* Integrations List */}
      <div className="bg-card border rounded-lg p-6">
        {filteredIntegrations.length === 0 ? (
          <div className="text-center py-12">
            <Settings2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد تكاملات</h3>
            <p className="text-muted-foreground mb-4">
              ابدأ بإضافة تكامل جديد للاتصال بالأنظمة الخارجية
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة تكامل
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIntegrations.map((integration) => (
              <div key={integration.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getIntegrationIcon(integration.integration_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{integration.integration_name}</h3>
                        {integration.is_active && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">نشط</span>
                        )}
                        {!integration.is_active && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">معطل</span>
                        )}
                        {integration.is_verified && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">متحقق منه</span>
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
                          <span className="text-blue-600 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            يتم المزامنة...
                          </span>
                        )}
                        {integration.sync_status === 'error' && (
                          <span className="text-red-600">خطأ</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {integration.integration_type === 'siem' && integration.is_active && (
                      <button
                        onClick={() => handleSync(integration)}
                        disabled={syncMutation.isPending || integration.sync_status === 'syncing'}
                        className="px-3 py-1 border rounded-md hover:bg-muted disabled:opacity-50 flex items-center gap-1 text-sm"
                      >
                        <RefreshCw className="w-3 h-3" />
                        مزامنة
                      </button>
                    )}

                    {!integration.is_verified && (
                      <button
                        onClick={() => handleVerify(integration)}
                        disabled={verifyMutation.isPending}
                        className="px-3 py-1 border rounded-md hover:bg-muted disabled:opacity-50 text-sm"
                      >
                        تحقق
                      </button>
                    )}

                    <button
                      onClick={() => handleToggle(integration)}
                      disabled={toggleMutation.isPending}
                      className="px-3 py-1 border rounded-md hover:bg-muted disabled:opacity-50 text-sm"
                    >
                      {integration.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedIntegration(integration);
                        setShowDetailsDialog(true);
                      }}
                      className="px-3 py-1 border rounded-md hover:bg-muted text-sm"
                    >
                      عرض
                    </button>

                    <button
                      onClick={() => {
                        setSelectedIntegration(integration);
                        setShowEditDialog(true);
                      }}
                      className="px-3 py-1 border rounded-md hover:bg-muted text-sm"
                    >
                      تعديل
                    </button>

                    <button
                      onClick={() => {
                        setSelectedIntegration(integration);
                        setShowDeleteDialog(true);
                      }}
                      className="px-3 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateIntegrationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {selectedIntegration && (
        <>
          <EditIntegrationDialog
            integration={selectedIntegration}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />

          <IntegrationDetailsDialog
            integration={selectedIntegration}
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowDeleteDialog(false)}>
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">تأكيد الحذف</h2>
            <p className="text-muted-foreground mb-6">
              هل أنت متأكد من حذف هذا التكامل؟ لن يتم استقبال أي أحداث من هذا المصدر بعد الحذف.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border rounded-md hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
