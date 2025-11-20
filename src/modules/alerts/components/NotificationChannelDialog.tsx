/**
 * Notification Channel Dialog Component
 * Week 4 - Phase 2
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Switch } from '@/core/components/ui/switch';
import { Textarea } from '@/core/components/ui/textarea';
import { useAlertChannels } from '@/features/observability/hooks/useAlertChannels';
import type { AlertChannel } from '@/modules/alerts/types';

const formSchema = z.object({
  name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  type: z.enum(['email', 'webhook', 'slack']).optional(),
  config_json: z.string().min(2, 'مطلوب'),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface NotificationChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: AlertChannel | null;
}

export function NotificationChannelDialog({
  open,
  onOpenChange,
  channel,
}: NotificationChannelDialogProps) {
  const { createChannel, updateChannel } = useAlertChannels();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'email',
      config_json: '{}',
      is_active: true,
    },
  });

  useEffect(() => {
    if (channel) {
      const channelType = channel.type === 'sms' ? 'email' : channel.type;
      form.reset({
        name: channel.name,
        type: channelType as any,
        config_json: JSON.stringify(channel.config_json, null, 2),
        is_active: channel.is_active,
      });
    } else {
      form.reset({
        name: '',
        type: 'email',
        config_json: '{}',
        is_active: true,
      });
    }
  }, [channel, form]);

  const onSubmit = (data: FormData) => {
    const payload: any = {
      name: data.name,
      type: data.type || 'email',
      is_active: data.is_active,
      config_json: JSON.parse(data.config_json),
    };

    if (channel) {
      updateChannel({ id: channel.id, data: payload });
    } else {
      createChannel(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {channel ? 'تعديل قناة الإشعارات' : 'إضافة قناة إشعارات جديدة'}
          </DialogTitle>
          <DialogDescription>
            قم بتكوين قناة لإرسال التنبيهات والإشعارات
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم القناة</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: بريد المدير" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع القناة</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">البريد الإلكتروني</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="config_json"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الإعدادات (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={6}
                      placeholder='{"email": "admin@example.com"}'
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>تفعيل القناة</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      تفعيل أو تعطيل استخدام هذه القناة
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {channel ? 'تحديث' : 'إنشاء'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
