/**
 * Webhook Manager Component
 * Gate-M15: Manage incoming webhooks
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Plus, Copy, RefreshCw, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchWebhooks,
  createWebhook,
  deleteWebhook,
  regenerateWebhookSecret,
} from '../integration';
import type { IntegrationWebhook } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';

export function WebhookManager() {
  const { t } = useTranslation();
  const { tenantId } = useAppContext();
  const [webhooks, setWebhooks] = useState<IntegrationWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState('');

  useEffect(() => {
    loadWebhooks();
  }, [tenantId]);

  const loadWebhooks = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const data = await fetchWebhooks(tenantId);
      setWebhooks(data);
    } catch (error: any) {
      toast.error('فشل تحميل Webhooks', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!tenantId || !newWebhookName) return;

    try {
      await createWebhook(tenantId, {
        name: newWebhookName,
        events: ['*'],
      });
      toast.success('تم إنشاء Webhook بنجاح');
      setIsCreateModalOpen(false);
      setNewWebhookName('');
      loadWebhooks();
    } catch (error: any) {
      toast.error('فشل إنشاء Webhook', {
        description: error.message,
      });
    }
  };

  const handleCopyURL = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ URL');
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('تم نسخ Secret');
  };

  const handleRegenerateSecret = async (webhookId: string) => {
    if (!tenantId) return;

    try {
      const newSecret = await regenerateWebhookSecret(tenantId, webhookId);
      toast.success('تم إعادة إنشاء Secret بنجاح');
      loadWebhooks();
    } catch (error: any) {
      toast.error('فشل إعادة إنشاء Secret', {
        description: error.message,
      });
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!tenantId) return;
    if (!confirm('هل أنت متأكد من حذف هذا Webhook؟')) return;

    try {
      await deleteWebhook(tenantId, webhookId);
      toast.success('تم حذف Webhook');
      loadWebhooks();
    } catch (error: any) {
      toast.error('فشل حذف Webhook', {
        description: error.message,
      });
    }
  };

  if (!tenantId) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">لم يتم العثور على معرف الجهة</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة Webhooks</h2>
          <p className="text-muted-foreground">
            استقبال الأحداث من الأنظمة الخارجية
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء Webhook
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : webhooks.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">لا توجد Webhooks بعد</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{webhook.name}</h3>
                    {webhook.active ? (
                      <Badge variant="default" className="mt-1">نشط</Badge>
                    ) : (
                      <Badge variant="secondary" className="mt-1">غير نشط</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(webhook.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">URL:</span>
                    <code className="flex-1 bg-muted px-2 py-1 rounded text-xs">
                      {webhook.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyURL(webhook.url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Secret:</span>
                    <code className="flex-1 bg-muted px-2 py-1 rounded text-xs">
                      {webhook.secret.substring(0, 20)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySecret(webhook.secret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerateSecret(webhook.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {webhook.events.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">الأحداث:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.events.map((event, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء Webhook جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook_name">اسم Webhook</Label>
              <Input
                id="webhook_name"
                value={newWebhookName}
                onChange={(e) => setNewWebhookName(e.target.value)}
                placeholder="مثال: استقبال أحداث النظام X"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreate} disabled={!newWebhookName}>
                إنشاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
