// ============================================================================
// Gate-E: Channel Form Dialog Component
// ============================================================================

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Switch } from '@/core/components/ui/switch';
import { useAlertChannels } from '@/features/observability/hooks/useAlertChannels';
import type { AlertChannel } from '@/modules/observability';

const channelSchema = z.object({
  type: z.enum(['email', 'webhook', 'slack']),
  name: z.string().min(1, 'الاسم مطلوب'),
  is_active: z.boolean().default(true),
  config_email_to: z.string().optional(),
  config_webhook_url: z.string().optional(),
  config_slack_webhook: z.string().optional(),
});

type ChannelFormData = z.infer<typeof channelSchema>;

interface ChannelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: AlertChannel | null;
}

export function ChannelFormDialog({ open, onOpenChange, channel }: ChannelFormDialogProps) {
  const { createChannel, updateChannel } = useAlertChannels();
  const [selectedType, setSelectedType] = useState<'email' | 'webhook' | 'slack'>('email');

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      type: 'email',
      name: '',
      is_active: true,
    },
  });

  const isActive = watch('is_active');

  useEffect(() => {
    if (channel) {
      setValue('type', channel.type as any);
      setValue('name', channel.name);
      setValue('is_active', channel.is_active);
      setSelectedType(channel.type as any);

      if (channel.type === 'email' && channel.config_json.to) {
        setValue('config_email_to', channel.config_json.to);
      } else if (channel.type === 'webhook' && channel.config_json.url) {
        setValue('config_webhook_url', channel.config_json.url);
      } else if (channel.type === 'slack' && channel.config_json.webhook_url) {
        setValue('config_slack_webhook', channel.config_json.webhook_url);
      }
    } else {
      reset({
        type: 'email',
        name: '',
        is_active: true,
      });
      setSelectedType('email');
    }
  }, [channel, setValue, reset]);

  const onSubmit = (data: ChannelFormData) => {
    const config_json: any = {};

    if (data.type === 'email') {
      config_json.to = data.config_email_to || '';
    } else if (data.type === 'webhook') {
      config_json.url = data.config_webhook_url || '';
    } else if (data.type === 'slack') {
      config_json.webhook_url = data.config_slack_webhook || '';
    }

    const payload = {
      type: data.type,
      name: data.name,
      is_active: data.is_active,
      config_json,
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{channel ? 'تعديل القناة' : 'إضافة قناة جديدة'}</DialogTitle>
          <DialogDescription>
            قم بإعداد قناة لإرسال التنبيهات
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>النوع</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => {
                setSelectedType(value as any);
                setValue('type', value as any);
              }}
              disabled={!!channel}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>الاسم</Label>
            <Input {...register('name')} placeholder="مثال: قناة البريد الرئيسية" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {selectedType === 'email' && (
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input {...register('config_email_to')} placeholder="admin@example.com" type="email" />
            </div>
          )}

          {selectedType === 'webhook' && (
            <div className="space-y-2">
              <Label>رابط Webhook</Label>
              <Input {...register('config_webhook_url')} placeholder="https://example.com/webhook" />
            </div>
          )}

          {selectedType === 'slack' && (
            <div className="space-y-2">
              <Label>Slack Webhook URL</Label>
              <Input {...register('config_slack_webhook')} placeholder="https://hooks.slack.com/..." />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="is-active">تفعيل القناة</Label>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">
              {channel ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
