/**
 * Action Plan Automation Component
 * Manages automated reminders and escalations for action plans
 */

import { useState } from 'react';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Switch } from '@/core/components/ui/switch';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  Bell,
  Clock,
  AlertTriangle,
  Mail,
  Calendar,
  Users,
  Settings,
  Play,
  Pause,
} from 'lucide-react';
import { useActionNotifications } from '../hooks';
import type { CreateNotificationInput, NotificationSeverity } from '../types/notifications.types';

interface ActionPlanAutomationProps {
  actionId: string;
  actionTitle: string;
}

export function ActionPlanAutomation({
  actionId,
  actionTitle,
}: ActionPlanAutomationProps) {
  const { data: notifications, isLoading } = useActionNotifications(actionId);

  // Automation Settings State
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(true);
  const [escalationEnabled, setEscalationEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState(3);
  const [escalationDays, setEscalationDays] = useState(7);

  // Create Notification State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState<NotificationSeverity>('info');

  const pendingNotifications = notifications?.filter(
    (n) => n.delivery_status === 'pending'
  ) || [];
  const sentNotifications = notifications?.filter(
    (n) => n.delivery_status === 'sent'
  ) || [];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'info':
        return <Bell className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { label: string; variant: any }> = {
      critical: { label: 'حرج', variant: 'destructive' },
      warning: { label: 'تحذير', variant: 'outline' },
      info: { label: 'معلومة', variant: 'secondary' },
    };
    const config = variants[severity] || variants.info;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reminder: 'تذكير',
      escalation: 'تصعيد',
      milestone_due: 'موعد معلم',
      dependency_blocked: 'تبعية محظورة',
      overdue: 'متأخر',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Automation Settings */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إعدادات الأتمتة
            </h3>
          </div>

          {/* Auto Reminders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">التذكيرات التلقائية</Label>
                <p className="text-sm text-muted-foreground">
                  إرسال تذكيرات تلقائية قبل مواعيد الاستحقاق
                </p>
              </div>
              <Switch
                checked={autoRemindersEnabled}
                onCheckedChange={setAutoRemindersEnabled}
              />
            </div>

            {autoRemindersEnabled && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="reminderDays" className="text-sm">
                      إرسال التذكير قبل
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="reminderDays"
                        type="number"
                        value={reminderDays}
                        onChange={(e) => setReminderDays(parseInt(e.target.value) || 3)}
                        min="1"
                        max="30"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">يوم</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm">قنوات الإرسال</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">البريد الإلكتروني</Badge>
                      <Badge variant="outline">الإشعارات الداخلية</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Auto Escalation */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">التصعيد التلقائي</Label>
                <p className="text-sm text-muted-foreground">
                  تصعيد الإجراءات المتأخرة للمسؤولين
                </p>
              </div>
              <Switch
                checked={escalationEnabled}
                onCheckedChange={setEscalationEnabled}
              />
            </div>

            {escalationEnabled && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="escalationDays" className="text-sm">
                      التصعيد بعد تأخر
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="escalationDays"
                        type="number"
                        value={escalationDays}
                        onChange={(e) => setEscalationDays(parseInt(e.target.value) || 7)}
                        min="1"
                        max="60"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">يوم</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm">المستلمون</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">المسؤول المباشر</Badge>
                      <Badge variant="outline">مدير المخاطر</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <Button className="w-full">
              <Play className="h-4 w-4 ml-2" />
              حفظ إعدادات الأتمتة
            </Button>
          </div>
        </div>
      </Card>

      {/* Notification Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الإشعارات</p>
              <p className="text-2xl font-bold text-foreground">
                {notifications?.length || 0}
              </p>
            </div>
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">قيد الإرسال</p>
              <p className="text-2xl font-bold text-blue-600">
                {pendingNotifications.length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">تم الإرسال</p>
              <p className="text-2xl font-bold text-green-600">
                {sentNotifications.length}
              </p>
            </div>
            <Mail className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5" />
              الإشعارات الأخيرة
            </h3>
            <Button variant="outline" size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'إلغاء' : 'إنشاء إشعار'}
            </Button>
          </div>

          {showCreateForm && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notificationTitle">العنوان</Label>
                <Input
                  id="notificationTitle"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="عنوان الإشعار"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationMessage">الرسالة</Label>
                <Textarea
                  id="notificationMessage"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="نص الإشعار"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationSeverity">درجة الأهمية</Label>
                <Select
                  value={notificationSeverity}
                  onValueChange={(value) => setNotificationSeverity(value as NotificationSeverity)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">معلومة</SelectItem>
                    <SelectItem value="warning">تحذير</SelectItem>
                    <SelectItem value="critical">حرج</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">
                <Bell className="h-4 w-4 ml-2" />
                إنشاء الإشعار
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="mt-1">{getSeverityIcon(notification.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground">
                        {notification.title_ar}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getSeverityBadge(notification.severity)}
                        <Badge variant="outline">
                          {getTypeLabel(notification.notification_type)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message_ar}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(notification.triggered_at).toLocaleDateString('ar-SA')}
                      </span>
                      {notification.delivery_status === 'sent' && notification.sent_at && (
                        <Badge variant="secondary" className="text-xs">
                          تم الإرسال
                        </Badge>
                      )}
                      {notification.acknowledged_at && (
                        <Badge variant="default" className="text-xs">
                          تم الاطلاع
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد إشعارات لهذا الإجراء
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
