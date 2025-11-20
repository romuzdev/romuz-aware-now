/**
 * M18: Incident Response - Settings Page
 */

import { useState } from 'react';
import { PageHeader } from '@/core/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Switch } from '@/core/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Textarea } from '@/core/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/core/components/ui/use-toast';
import { Bell, Shield, Users, Zap, Settings2, Save } from 'lucide-react';

export default function IncidentSettings() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    slackEnabled: false,
    teamsEnabled: false,
    criticalOnly: false,
    notifyOnCreate: true,
    notifyOnAssign: true,
    notifyOnStatusChange: true,
    notifyOnClose: false,
    emailRecipients: 'security@company.com',
    slackWebhook: '',
    teamsWebhook: '',
  });

  // Escalation Settings
  const [escalationSettings, setEscalationSettings] = useState({
    autoEscalate: true,
    criticalEscalationMinutes: 30,
    highEscalationMinutes: 120,
    mediumEscalationMinutes: 480,
    escalationChain: 'security-team@company.com, ciso@company.com',
  });

  // Auto-Assignment Settings
  const [autoAssignSettings, setAutoAssignSettings] = useState({
    enabled: false,
    assignmentMethod: 'round-robin', // round-robin, least-loaded, random
    defaultAssignee: '',
    criticalAssignee: '',
    highAssignee: '',
  });

  // Response Settings
  const [responseSettings, setResponseSettings] = useState({
    autoAcknowledge: false,
    requireApprovalToClose: true,
    mandatoryRootCause: true,
    mandatoryLessonsLearned: true,
    slaEnabled: true,
    criticalSlaHours: 4,
    highSlaHours: 24,
    mediumSlaHours: 72,
  });

  const handleSave = (section: string) => {
    toast({
      title: isRTL ? 'تم الحفظ' : 'Saved',
      description: isRTL ? `تم حفظ إعدادات ${section} بنجاح` : `${section} settings saved successfully`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRTL ? 'إعدادات الاستجابة للحوادث' : 'Incident Response Settings'}
        description={isRTL ? 'تكوين إعدادات النظام والإشعارات والاستجابة' : 'Configure system settings, notifications and response rules'}
      />

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            {isRTL ? 'الإشعارات' : 'Notifications'}
          </TabsTrigger>
          <TabsTrigger value="escalation">
            <Zap className="h-4 w-4 mr-2" />
            {isRTL ? 'التصعيد' : 'Escalation'}
          </TabsTrigger>
          <TabsTrigger value="assignment">
            <Users className="h-4 w-4 mr-2" />
            {isRTL ? 'التعيين التلقائي' : 'Auto-Assignment'}
          </TabsTrigger>
          <TabsTrigger value="response">
            <Shield className="h-4 w-4 mr-2" />
            {isRTL ? 'الاستجابة' : 'Response'}
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings2 className="h-4 w-4 mr-2" />
            {isRTL ? 'متقدم' : 'Advanced'}
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'قنوات الإشعارات' : 'Notification Channels'}</CardTitle>
              <CardDescription>
                {isRTL ? 'حدد القنوات التي تريد استقبال الإشعارات عبرها' : 'Select channels for receiving notifications'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{isRTL ? 'البريد الإلكتروني' : 'Email Notifications'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'إرسال إشعارات عبر البريد الإلكتروني' : 'Send notifications via email'}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailEnabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailEnabled: checked })
                  }
                />
              </div>

              {notificationSettings.emailEnabled && (
                <div className="space-y-2">
                  <Label>{isRTL ? 'البريد الإلكتروني للمستلمين' : 'Email Recipients'}</Label>
                  <Input
                    value={notificationSettings.emailRecipients}
                    onChange={(e) =>
                      setNotificationSettings({ ...notificationSettings, emailRecipients: e.target.value })
                    }
                    placeholder="security@company.com, admin@company.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'افصل بين العناوين بفاصلة' : 'Separate multiple emails with commas'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Slack</Label>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'إرسال إشعارات عبر Slack' : 'Send notifications to Slack'}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.slackEnabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, slackEnabled: checked })
                  }
                />
              </div>

              {notificationSettings.slackEnabled && (
                <div className="space-y-2">
                  <Label>Slack Webhook URL</Label>
                  <Input
                    value={notificationSettings.slackWebhook}
                    onChange={(e) =>
                      setNotificationSettings({ ...notificationSettings, slackWebhook: e.target.value })
                    }
                    placeholder="https://hooks.slack.com/services/..."
                    type="url"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Microsoft Teams</Label>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'إرسال إشعارات عبر Teams' : 'Send notifications to Teams'}
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.teamsEnabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, teamsEnabled: checked })
                  }
                />
              </div>

              {notificationSettings.teamsEnabled && (
                <div className="space-y-2">
                  <Label>Teams Webhook URL</Label>
                  <Input
                    value={notificationSettings.teamsWebhook}
                    onChange={(e) =>
                      setNotificationSettings({ ...notificationSettings, teamsWebhook: e.target.value })
                    }
                    placeholder="https://outlook.office.com/webhook/..."
                    type="url"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'أحداث الإشعارات' : 'Notification Events'}</CardTitle>
              <CardDescription>
                {isRTL ? 'اختر الأحداث التي تريد تلقي إشعارات عنها' : 'Choose which events trigger notifications'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'إشعار عند إنشاء حدث جديد' : 'Notify on new incident'}</Label>
                <Switch
                  checked={notificationSettings.notifyOnCreate}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, notifyOnCreate: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'إشعار عند التعيين' : 'Notify on assignment'}</Label>
                <Switch
                  checked={notificationSettings.notifyOnAssign}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, notifyOnAssign: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'إشعار عند تغيير الحالة' : 'Notify on status change'}</Label>
                <Switch
                  checked={notificationSettings.notifyOnStatusChange}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, notifyOnStatusChange: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'إشعار عند الإغلاق' : 'Notify on closure'}</Label>
                <Switch
                  checked={notificationSettings.notifyOnClose}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, notifyOnClose: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'الحوادث الحرجة فقط' : 'Critical incidents only'}</Label>
                <Switch
                  checked={notificationSettings.criticalOnly}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, criticalOnly: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSave(isRTL ? 'الإشعارات' : 'Notifications')}>
              <Save className="h-4 w-4 mr-2" />
              {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Escalation Tab */}
        <TabsContent value="escalation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'قواعد التصعيد' : 'Escalation Rules'}</CardTitle>
              <CardDescription>
                {isRTL ? 'حدد متى وكيف يتم تصعيد الحوادث' : 'Define when and how incidents should be escalated'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{isRTL ? 'تفعيل التصعيد التلقائي' : 'Enable Auto-Escalation'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'تصعيد الحوادث تلقائياً بناءً على الوقت' : 'Automatically escalate based on time thresholds'}
                  </p>
                </div>
                <Switch
                  checked={escalationSettings.autoEscalate}
                  onCheckedChange={(checked) =>
                    setEscalationSettings({ ...escalationSettings, autoEscalate: checked })
                  }
                />
              </div>

              {escalationSettings.autoEscalate && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRTL ? 'وقت تصعيد الحوادث الحرجة (دقائق)' : 'Critical Escalation Time (minutes)'}</Label>
                      <Input
                        type="number"
                        value={escalationSettings.criticalEscalationMinutes}
                        onChange={(e) =>
                          setEscalationSettings({
                            ...escalationSettings,
                            criticalEscalationMinutes: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{isRTL ? 'وقت تصعيد الحوادث العالية (دقائق)' : 'High Escalation Time (minutes)'}</Label>
                      <Input
                        type="number"
                        value={escalationSettings.highEscalationMinutes}
                        onChange={(e) =>
                          setEscalationSettings({
                            ...escalationSettings,
                            highEscalationMinutes: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'وقت تصعيد الحوادث المتوسطة (دقائق)' : 'Medium Escalation Time (minutes)'}</Label>
                    <Input
                      type="number"
                      value={escalationSettings.mediumEscalationMinutes}
                      onChange={(e) =>
                        setEscalationSettings({
                          ...escalationSettings,
                          mediumEscalationMinutes: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'سلسلة التصعيد (البريد الإلكتروني)' : 'Escalation Chain (Email)'}</Label>
                    <Textarea
                      value={escalationSettings.escalationChain}
                      onChange={(e) =>
                        setEscalationSettings({ ...escalationSettings, escalationChain: e.target.value })
                      }
                      placeholder="security-team@company.com, ciso@company.com"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'افصل بين العناوين بفاصلة، حسب الأولوية' : 'Separate emails with commas, in priority order'}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSave(isRTL ? 'التصعيد' : 'Escalation')}>
              <Save className="h-4 w-4 mr-2" />
              {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Auto-Assignment Tab */}
        <TabsContent value="assignment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'التعيين التلقائي' : 'Auto-Assignment'}</CardTitle>
              <CardDescription>
                {isRTL ? 'قواعد تعيين الحوادث تلقائياً' : 'Rules for automatically assigning incidents'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{isRTL ? 'تفعيل التعيين التلقائي' : 'Enable Auto-Assignment'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'تعيين الحوادث الجديدة تلقائياً' : 'Automatically assign new incidents'}
                  </p>
                </div>
                <Switch
                  checked={autoAssignSettings.enabled}
                  onCheckedChange={(checked) => setAutoAssignSettings({ ...autoAssignSettings, enabled: checked })}
                />
              </div>

              {autoAssignSettings.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>{isRTL ? 'طريقة التعيين' : 'Assignment Method'}</Label>
                    <Select
                      value={autoAssignSettings.assignmentMethod}
                      onValueChange={(value) =>
                        setAutoAssignSettings({ ...autoAssignSettings, assignmentMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round-robin">
                          {isRTL ? 'توزيع دائري' : 'Round Robin'}
                        </SelectItem>
                        <SelectItem value="least-loaded">
                          {isRTL ? 'الأقل عبئاً' : 'Least Loaded'}
                        </SelectItem>
                        <SelectItem value="random">
                          {isRTL ? 'عشوائي' : 'Random'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'المعين الافتراضي' : 'Default Assignee'}</Label>
                    <Input
                      value={autoAssignSettings.defaultAssignee}
                      onChange={(e) =>
                        setAutoAssignSettings({ ...autoAssignSettings, defaultAssignee: e.target.value })
                      }
                      placeholder="user@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'المعين للحوادث الحرجة' : 'Critical Incident Assignee'}</Label>
                    <Input
                      value={autoAssignSettings.criticalAssignee}
                      onChange={(e) =>
                        setAutoAssignSettings({ ...autoAssignSettings, criticalAssignee: e.target.value })
                      }
                      placeholder="security-lead@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'المعين للحوادث العالية' : 'High Incident Assignee'}</Label>
                    <Input
                      value={autoAssignSettings.highAssignee}
                      onChange={(e) =>
                        setAutoAssignSettings({ ...autoAssignSettings, highAssignee: e.target.value })
                      }
                      placeholder="security-team@company.com"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSave(isRTL ? 'التعيين التلقائي' : 'Auto-Assignment')}>
              <Save className="h-4 w-4 mr-2" />
              {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Response Tab */}
        <TabsContent value="response" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'إعدادات الاستجابة' : 'Response Settings'}</CardTitle>
              <CardDescription>
                {isRTL ? 'ضوابط وقواعد الاستجابة للحوادث' : 'Incident response controls and rules'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'التأكيد التلقائي' : 'Auto-Acknowledge'}</Label>
                <Switch
                  checked={responseSettings.autoAcknowledge}
                  onCheckedChange={(checked) =>
                    setResponseSettings({ ...responseSettings, autoAcknowledge: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'يتطلب موافقة للإغلاق' : 'Require Approval to Close'}</Label>
                <Switch
                  checked={responseSettings.requireApprovalToClose}
                  onCheckedChange={(checked) =>
                    setResponseSettings({ ...responseSettings, requireApprovalToClose: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'السبب الجذري إلزامي' : 'Root Cause Mandatory'}</Label>
                <Switch
                  checked={responseSettings.mandatoryRootCause}
                  onCheckedChange={(checked) =>
                    setResponseSettings({ ...responseSettings, mandatoryRootCause: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'الدروس المستفادة إلزامية' : 'Lessons Learned Mandatory'}</Label>
                <Switch
                  checked={responseSettings.mandatoryLessonsLearned}
                  onCheckedChange={(checked) =>
                    setResponseSettings({ ...responseSettings, mandatoryLessonsLearned: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SLA {isRTL ? 'اتفاقية مستوى الخدمة' : 'Service Level Agreement'}</CardTitle>
              <CardDescription>
                {isRTL ? 'حدد أوقات الاستجابة المطلوبة' : 'Define required response times'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'تفعيل SLA' : 'Enable SLA'}</Label>
                <Switch
                  checked={responseSettings.slaEnabled}
                  onCheckedChange={(checked) => setResponseSettings({ ...responseSettings, slaEnabled: checked })}
                />
              </div>

              {responseSettings.slaEnabled && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{isRTL ? 'حرج (ساعات)' : 'Critical (hours)'}</Label>
                    <Input
                      type="number"
                      value={responseSettings.criticalSlaHours}
                      onChange={(e) =>
                        setResponseSettings({ ...responseSettings, criticalSlaHours: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'عالي (ساعات)' : 'High (hours)'}</Label>
                    <Input
                      type="number"
                      value={responseSettings.highSlaHours}
                      onChange={(e) =>
                        setResponseSettings({ ...responseSettings, highSlaHours: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{isRTL ? 'متوسط (ساعات)' : 'Medium (hours)'}</Label>
                    <Input
                      type="number"
                      value={responseSettings.mediumSlaHours}
                      onChange={(e) =>
                        setResponseSettings({ ...responseSettings, mediumSlaHours: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSave(isRTL ? 'الاستجابة' : 'Response')}>
              <Save className="h-4 w-4 mr-2" />
              {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'إعدادات متقدمة' : 'Advanced Settings'}</CardTitle>
              <CardDescription>
                {isRTL ? 'إعدادات متقدمة للنظام' : 'Advanced system configurations'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? 'الإعدادات المتقدمة ستكون متاحة قريباً. تشمل: التكامل مع SIEM، التصنيف الذكي بالذكاء الاصطناعي، والمزيد.'
                    : 'Advanced settings will be available soon. Includes: SIEM integration, AI-powered classification, and more.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
