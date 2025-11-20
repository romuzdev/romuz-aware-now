/**
 * D4 Enhancement: Committee Notifications Panel
 * Display and manage committee notifications
 */

import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  useMyNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '@/modules/committees';
import type { CommitteeNotificationType, NotificationPriority } from '@/modules/committees';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const notificationTypeLabels: Record<CommitteeNotificationType, string> = {
  meeting_scheduled: 'اجتماع مجدول',
  meeting_reminder: 'تذكير باجتماع',
  meeting_cancelled: 'إلغاء اجتماع',
  decision_made: 'قرار جديد',
  followup_assigned: 'مهمة متابعة',
  followup_due: 'مهمة مستحقة',
  workflow_assigned: 'سير عمل مُعيّن',
  workflow_completed: 'سير عمل مكتمل',
  member_added: 'عضو جديد',
  document_shared: 'مستند مشترك',
  custom: 'مخصص',
};

function getPriorityColor(priority: NotificationPriority): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    default:
      return 'default';
  }
}

export function CommitteeNotificationsPanel() {
  const { data: notifications, isLoading } = useMyNotifications({ limit: 50 });
  const { data: unreadCount } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الإشعارات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>الإشعارات</CardTitle>
          {unreadCount && unreadCount > 0 ? (
            <Badge variant="destructive" className="rounded-full h-6 min-w-6 flex items-center justify-center">
              {unreadCount}
            </Badge>
          ) : null}
        </div>
        {notifications && notifications.length > 0 && unreadCount && unreadCount > 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 ml-2" />
            تعليم الكل كمقروء
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>لا توجد إشعارات</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`border-r-4 transition-opacity ${
                    notification.status === 'read' ? 'opacity-60' : ''
                  }`}
                  style={{
                    borderRightColor:
                      notification.status !== 'read'
                        ? notification.priority === 'urgent'
                          ? 'hsl(var(--destructive))'
                          : notification.priority === 'high'
                          ? 'hsl(var(--warning))'
                          : 'hsl(var(--primary))'
                        : 'hsl(var(--border))',
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                            {notificationTypeLabels[notification.notification_type]}
                          </Badge>
                          {notification.status !== 'read' && (
                            <Badge variant="secondary" className="text-xs">
                              جديد
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mb-2">{notification.message}</p>
                        {notification.committee && (
                          <p className="text-xs text-muted-foreground mb-1">
                            اللجنة: {notification.committee.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {notification.status !== 'read' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markAsRead.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(notification.id)}
                          disabled={deleteNotification.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
