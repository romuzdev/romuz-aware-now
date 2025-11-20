/**
 * Microsoft Teams Configuration Modal
 * Gate-M15: Setup wizard for Teams integration
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Checkbox } from '@/core/components/ui/checkbox';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { createConnector, updateConnector } from '../integration/connectors.integration';
import { testTeamsConnection } from '../services/teams-connector';
import { toast } from 'sonner';
import type { IntegrationConnector } from '../types';

interface TeamsConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connector?: IntegrationConnector;
  onSuccess?: () => void;
}

export function TeamsConfigModal({ open, onOpenChange, connector, onSuccess }: TeamsConfigModalProps) {
  const { tenantId } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: connector?.name || 'Microsoft Teams',
    webhook_url: (connector?.config as any)?.webhook_url || '',
    channel_name: (connector?.config as any)?.channel_name || '',
    retry_enabled: (connector?.config as any)?.retry_enabled ?? true,
    max_retries: (connector?.config as any)?.max_retries || 3,
  });

  const handleSubmit = async () => {
    if (!formData.webhook_url) {
      toast.error('الرجاء إدخال رابط Webhook');
      return;
    }

    try {
      setLoading(true);

      const config = {
        webhook_url: formData.webhook_url,
        channel_name: formData.channel_name,
        retry_enabled: formData.retry_enabled,
        max_retries: formData.max_retries,
      };

      if (connector) {
        await updateConnector(tenantId!, connector.id, {
          name: formData.name,
          config,
        });
        toast.success('تم تحديث التكامل بنجاح');
      } else {
        await createConnector(tenantId!, {
          name: formData.name,
          type: 'teams',
          config,
        });
        toast.success('تم إنشاء التكامل بنجاح');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save Teams connector:', error);
      toast.error('فشل حفظ التكامل');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!formData.webhook_url) {
      toast.error('الرجاء إدخال رابط Webhook أولاً');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      // Create temporary connector for testing
      const tempConnector = await createConnector(tenantId!, {
        name: 'Test Teams Connection',
        type: 'teams',
        config: {
          webhook_url: formData.webhook_url,
        },
      });

      const result = await testTeamsConnection(tempConnector.id);
      setTestResult(result);

      if (result.success) {
        toast.success('اختبار الاتصال نجح!');
      } else {
        toast.error('فشل اختبار الاتصال');
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
      toast.error('فشل اختبار الاتصال');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {connector ? 'تعديل تكامل Microsoft Teams' : 'إضافة تكامل Microsoft Teams'}
          </DialogTitle>
          <DialogDescription>
            قم بإعداد التكامل مع Microsoft Teams لإرسال الإشعارات إلى قنواتك
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">الإعدادات</TabsTrigger>
            <TabsTrigger value="guide">دليل الإعداد</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم التكامل</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Microsoft Teams - القناة العامة"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_url">رابط Webhook *</Label>
              <Input
                id="webhook_url"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                placeholder="https://outlook.office.com/webhook/..."
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                احصل على هذا الرابط من إعدادات القناة في Teams
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel_name">اسم القناة (اختياري)</Label>
              <Input
                id="channel_name"
                value={formData.channel_name}
                onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                placeholder="القناة العامة"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="retry_enabled"
                  checked={formData.retry_enabled}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, retry_enabled: checked as boolean })
                  }
                />
                <Label htmlFor="retry_enabled" className="text-sm cursor-pointer">
                  تفعيل إعادة المحاولة عند الفشل
                </Label>
              </div>

              {formData.retry_enabled && (
                <div className="space-y-2 mr-6">
                  <Label htmlFor="max_retries">عدد المحاولات</Label>
                  <Input
                    id="max_retries"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.max_retries}
                    onChange={(e) => setFormData({ ...formData, max_retries: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>

            {testResult && (
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="guide" className="space-y-4 mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">كيفية الحصول على رابط Webhook:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>افتح Microsoft Teams</li>
                    <li>اذهب إلى القناة المطلوبة</li>
                    <li>اضغط على الثلاث نقاط (...) بجانب اسم القناة</li>
                    <li>اختر "Connectors"</li>
                    <li>ابحث عن "Incoming Webhook" واضغط "Configure"</li>
                    <li>أدخل اسماً للـ Webhook واضغط "Create"</li>
                    <li>انسخ الرابط الذي يظهر</li>
                  </ol>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    asChild
                  >
                    <a
                      href="https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      المزيد من التفاصيل
                      <ExternalLink className="w-3 h-3 mr-1" />
                    </a>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            variant="secondary"
            onClick={handleTest}
            disabled={testing || !formData.webhook_url}
          >
            {testing ? 'جاري الاختبار...' : 'اختبار الاتصال'}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'جاري الحفظ...' : connector ? 'تحديث' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
