/**
 * Notification Channels List Component
 * Week 4 - Phase 2
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Mail, MessageSquare, Webhook, Plus, Edit, Trash2 } from 'lucide-react';
import { useAlertChannels } from '@/features/observability/hooks/useAlertChannels';
import { NotificationChannelDialog } from './NotificationChannelDialog';
import type { AlertChannel } from '@/modules/alerts/types';

export function NotificationChannelsList() {
  const { channels, loading, deleteChannel } = useAlertChannels();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<AlertChannel | null>(null);

  const handleEdit = (channel: AlertChannel) => {
    setSelectedChannel(channel);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedChannel(null);
    setDialogOpen(true);
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-5 w-5" />;
      case 'sms': return <MessageSquare className="h-5 w-5" />;
      case 'webhook': return <Webhook className="h-5 w-5" />;
      default: return <Mail className="h-5 w-5" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قنوات الإشعارات</CardTitle>
              <CardDescription>
                إدارة قنوات إرسال التنبيهات والإشعارات
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة قناة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد قنوات إشعارات حالياً</p>
              </div>
            ) : (
              channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getChannelIcon(channel.type)}
                    <div>
                      <h4 className="font-semibold">{channel.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{channel.type}</Badge>
                        {channel.is_active ? (
                          <Badge variant="default">مفعّل</Badge>
                        ) : (
                          <Badge variant="secondary">معطّل</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(channel)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteChannel(channel.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <NotificationChannelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        channel={selectedChannel}
      />
    </>
  );
}
