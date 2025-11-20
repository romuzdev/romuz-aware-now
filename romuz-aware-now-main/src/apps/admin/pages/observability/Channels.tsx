// ============================================================================
// Gate-E: Alert Channels Management Page
// ============================================================================

import { useState } from 'react';
import { Plus, Mail, Webhook, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { useAlertChannels } from '@/features/observability/hooks/useAlertChannels';
import { ChannelFormDialog } from '@/features/observability/components/ChannelFormDialog';
import { AlertChannel } from '@/modules/observability';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { Skeleton } from '@/core/components/ui/skeleton';

export default function AlertChannelsPage() {
  const { channels, loading, deleteChannel } = useAlertChannels();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<AlertChannel | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);

  const handleEdit = (channel: AlertChannel) => {
    setEditingChannel(channel);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setChannelToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (channelToDelete) {
      deleteChannel(channelToDelete);
      setDeleteDialogOpen(false);
      setChannelToDelete(null);
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      case 'slack':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">قنوات التنبيهات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة قنوات إرسال التنبيهات (Email, Webhook, Slack)
          </p>
        </div>
        <Button onClick={() => { setEditingChannel(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة قناة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>القنوات المتاحة</CardTitle>
          <CardDescription>
            {channels.length} قناة مسجلة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد قنوات مسجلة. أضف أول قناة للبدء.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الإعدادات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getChannelIcon(channel.type)}
                        <span className="capitalize">{channel.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{channel.name}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {channel.type === 'email' && channel.config_json.to && (
                          <span>{channel.config_json.to}</span>
                        )}
                        {channel.type === 'webhook' && channel.config_json.url && (
                          <span className="truncate max-w-[200px] inline-block">
                            {channel.config_json.url}
                          </span>
                        )}
                        {channel.type === 'slack' && channel.config_json.webhook_url && (
                          <span>Slack Webhook</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={channel.is_active ? 'default' : 'secondary'}>
                        {channel.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(channel)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(channel.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ChannelFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        channel={editingChannel}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه القناة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
