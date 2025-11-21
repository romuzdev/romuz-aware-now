/**
 * Integration Details Dialog - Complete View
 */

import { X, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useWebhookLogsByIntegration } from '../hooks/useIntegrations';
import { getWebhookUrl } from '@/integrations/external';
import type { IncidentIntegration } from '@/integrations/external';

interface Props {
  integration: IncidentIntegration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IntegrationDetailsDialog({ integration, open, onOpenChange }: Props) {
  const [copied, setCopied] = useState(false);
  const { data: logs = [] } = useWebhookLogsByIntegration(integration.id, 10);

  if (!open) return null;

  const webhookUrl = integration.integration_type === 'webhook' || integration.integration_type === 'cloud_provider'
    ? getWebhookUrl(integration.id)
    : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{integration.integration_name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {integration.provider} • {integration.integration_type}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-muted rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">الحالة</p>
              <div className="flex items-center gap-2">
                {integration.is_active ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">نشط</span>
                  </>
                ) : (
                  <span className="font-semibold text-muted-foreground">معطل</span>
                )}
              </div>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">التحقق</p>
              <div className="flex items-center gap-2">
                {integration.is_verified ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">متحقق منه</span>
                  </>
                ) : (
                  <span className="font-semibold text-yellow-600">غير متحقق</span>
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">الإحصائيات</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">الأحداث المستلمة</p>
                <p className="text-2xl font-bold">{integration.total_events_received}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">آخر حدث</p>
                <p className="text-sm font-semibold">
                  {integration.last_event_at 
                    ? new Date(integration.last_event_at).toLocaleString('ar')
                    : 'لا يوجد'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">آخر مزامنة</p>
                <p className="text-sm font-semibold">
                  {integration.last_sync_at 
                    ? new Date(integration.last_sync_at).toLocaleString('ar')
                    : 'لا يوجد'}
                </p>
              </div>
            </div>
          </div>

          {/* Webhook URL */}
          {webhookUrl && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Webhook URL</h3>
                <button
                  onClick={() => copyToClipboard(webhookUrl)}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      نسخ
                    </>
                  )}
                </button>
              </div>
              <code className="block p-3 bg-blue-100 dark:bg-blue-900 rounded text-sm break-all">
                {webhookUrl}
              </code>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
                استخدم هذا الرابط لإرسال الأحداث من النظام الخارجي
              </p>
            </div>
          )}

          {/* Configuration */}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">الإعدادات</h3>
            <div className="space-y-2 text-sm">
              {integration.config_json?.base_url && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رابط API:</span>
                  <span className="font-mono">{integration.config_json.base_url}</span>
                </div>
              )}
              {integration.auth_type && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نوع المصادقة:</span>
                  <span>{integration.auth_type}</span>
                </div>
              )}
              {integration.config_json?.search_query && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">استعلام البحث:</span>
                  <span className="font-mono text-xs">{integration.config_json.search_query}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Logs */}
          {logs.length > 0 && (
            <div className="bg-card border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">آخر الأحداث ({logs.length})</h3>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                    <div>
                      <span className="font-semibold">{log.webhook_source}</span>
                      <span className="text-muted-foreground mx-2">•</span>
                      <span className={
                        log.processing_status === 'processed' ? 'text-green-600' :
                        log.processing_status === 'failed' ? 'text-red-600' :
                        'text-yellow-600'
                      }>
                        {log.processing_status === 'processed' ? 'معالج' :
                         log.processing_status === 'failed' ? 'فشل' : 'قيد المعالجة'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.received_at).toLocaleString('ar')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">معلومات إضافية</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                <span>{new Date(integration.created_at).toLocaleString('ar')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">آخر تحديث:</span>
                <span>{new Date(integration.updated_at).toLocaleString('ar')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">حالة المزامنة:</span>
                <span className={
                  integration.sync_status === 'idle' ? '' :
                  integration.sync_status === 'syncing' ? 'text-blue-600' :
                  'text-red-600'
                }>
                  {integration.sync_status === 'idle' ? 'جاهز' :
                   integration.sync_status === 'syncing' ? 'يتم المزامنة...' : 'خطأ'}
                </span>
              </div>
              {integration.last_error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>آخر خطأ:</strong> {integration.last_error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
