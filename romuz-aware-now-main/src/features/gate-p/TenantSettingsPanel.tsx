/**
 * Gate-P Tenant Settings Panel
 * Super Admin: Manage settings for any tenant
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Switch } from '@/core/components/ui/switch';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { useTenantSettings, useUpdateTenantSettings, useTenants } from '@/core/tenancy/integration';
import { useToast } from '@/hooks/use-toast';
import { Settings, AlertCircle, Save, Loader2, Shield } from 'lucide-react';
import { Separator } from '@/core/components/ui/separator';
import { usePlatformAdminProtection } from '@/core/hooks/utils/useRoleProtection';
import { RoleRequiredDialog } from '@/core/components/shared/RoleRequiredDialog';
import { logSettingsUpdate } from '@/lib/audit/gateP-audit';

interface SettingsForm {
  // SLA Config
  reminder_sla_hours: number;
  report_sla_days: number;
  
  // Feature Flags
  enable_gate_k: boolean;
  enable_gate_f: boolean;
  
  // Limits
  max_users: number;
  max_active_campaigns: number;
  
  // Notification Channels
  email: boolean;
  slack: boolean;
  
  // Storage Limits
  storage_limit_mb: number;
  storage_used_mb: number;
  
  // API Rate Limits
  api_rate_limit_per_minute: number;
  api_rate_limit_per_hour: number;
  api_unlimited: boolean;
  
  // Email Quotas
  email_quota_monthly: number;
  email_used_current_month: number;
  email_quota_reset_date: string;
  
  // Custom Branding
  branding_logo_url: string;
  branding_primary_color: string;
  branding_secondary_color: string;
  branding_app_name: string;
  branding_support_email: string;
  branding_support_phone: string;
  
  // Security Settings - Password Policy
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_special_chars: boolean;
  
  // Security Settings - MFA
  mfa_required: boolean;
  
  // Security Settings - Session
  session_timeout_minutes: number;
  session_absolute_timeout_minutes: number;
  
  // Security Settings - Login Attempts
  max_login_attempts: number;
  login_lockout_duration_minutes: number;
  login_notification_enabled: boolean;
  
  // Security Settings - IP Whitelisting
  ip_whitelist_enabled: boolean;
}

export default function TenantSettingsPanel() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants();
  const { data: response, isLoading, error } = useTenantSettings(selectedTenantId);
  const updateMutation = useUpdateTenantSettings();
  const { toast } = useToast();
  const roleProtection = usePlatformAdminProtection();

  const [formData, setFormData] = useState<SettingsForm>({
    reminder_sla_hours: 24,
    report_sla_days: 7,
    enable_gate_k: true,
    enable_gate_f: true,
    max_users: 100,
    max_active_campaigns: 10,
    email: true,
    slack: false,
    storage_limit_mb: 5120, // 5 GB
    storage_used_mb: 0,
    api_rate_limit_per_minute: 100,
    api_rate_limit_per_hour: 5000,
    api_unlimited: false,
    email_quota_monthly: 1000,
    email_used_current_month: 0,
    email_quota_reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
    branding_logo_url: '',
    branding_primary_color: 'hsl(222.2 47.4% 11.2%)',
    branding_secondary_color: 'hsl(210 40% 96.1%)',
    branding_app_name: 'Romuz Awareness',
    branding_support_email: '',
    branding_support_phone: '',
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_special_chars: true,
    mfa_required: false,
    session_timeout_minutes: 480,
    session_absolute_timeout_minutes: 1440,
    max_login_attempts: 5,
    login_lockout_duration_minutes: 30,
    login_notification_enabled: true,
    ip_whitelist_enabled: false,
  });

  // Set first tenant as default when loaded
  useEffect(() => {
    if (tenantsData && tenantsData.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenantsData[0].id);
    }
  }, [tenantsData, selectedTenantId]);

  // Load settings into form
  useEffect(() => {
    if (response?.success && response.data) {
      const settings = response.data;
      
      setFormData({
        reminder_sla_hours: settings.sla_config?.reminder_sla_hours || 24,
        report_sla_days: settings.sla_config?.report_sla_days || 7,
        enable_gate_k: settings.feature_flags?.enable_gate_k !== false,
        enable_gate_f: settings.feature_flags?.enable_gate_f !== false,
        max_users: settings.limits?.max_users || 100,
        max_active_campaigns: settings.limits?.max_active_campaigns || 10,
        email: settings.notification_channels?.email !== false,
        slack: settings.notification_channels?.slack || false,
        storage_limit_mb: settings.storage_limit_mb || 5120,
        storage_used_mb: settings.storage_used_mb || 0,
        api_rate_limit_per_minute: settings.api_rate_limit_per_minute || 100,
        api_rate_limit_per_hour: settings.api_rate_limit_per_hour || 5000,
        api_unlimited: settings.api_unlimited || false,
        email_quota_monthly: settings.email_quota_monthly || 1000,
        email_used_current_month: settings.email_used_current_month || 0,
        email_quota_reset_date: settings.email_quota_reset_date || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
        branding_logo_url: settings.branding_logo_url || '',
        branding_primary_color: settings.branding_primary_color || 'hsl(222.2 47.4% 11.2%)',
        branding_secondary_color: settings.branding_secondary_color || 'hsl(210 40% 96.1%)',
        branding_app_name: settings.branding_app_name || 'Romuz Awareness',
        branding_support_email: settings.branding_support_email || '',
        branding_support_phone: settings.branding_support_phone || '',
        password_min_length: settings.password_min_length || 8,
        password_require_uppercase: settings.password_require_uppercase !== false,
        password_require_lowercase: settings.password_require_lowercase !== false,
        password_require_numbers: settings.password_require_numbers !== false,
        password_require_special_chars: settings.password_require_special_chars !== false,
        mfa_required: settings.mfa_required || false,
        session_timeout_minutes: settings.session_timeout_minutes || 480,
        session_absolute_timeout_minutes: settings.session_absolute_timeout_minutes || 1440,
        max_login_attempts: settings.max_login_attempts || 5,
        login_lockout_duration_minutes: settings.login_lockout_duration_minutes || 30,
        login_notification_enabled: settings.login_notification_enabled !== false,
        ip_whitelist_enabled: settings.ip_whitelist_enabled || false,
      });
    }
  }, [response]);

  const handleSave = async () => {
    if (!selectedTenantId) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'الرجاء اختيار Tenant أولاً',
      });
      return;
    }

    await roleProtection.executeProtectedAction(async () => {
      try {
        const payload = {
          sla_config: {
            reminder_sla_hours: formData.reminder_sla_hours,
            report_sla_days: formData.report_sla_days,
          },
          feature_flags: {
            enable_gate_k: formData.enable_gate_k,
            enable_gate_f: formData.enable_gate_f,
          },
          limits: {
            max_users: formData.max_users,
            max_active_campaigns: formData.max_active_campaigns,
          },
        notification_channels: {
          email: formData.email,
          slack: formData.slack,
        },
        // Storage Limits
        storage_limit_mb: formData.storage_limit_mb,
        storage_used_mb: formData.storage_used_mb,
        // API Rate Limits
        api_rate_limit_per_minute: formData.api_rate_limit_per_minute,
        api_rate_limit_per_hour: formData.api_rate_limit_per_hour,
        api_unlimited: formData.api_unlimited,
        // Email Quotas
        email_quota_monthly: formData.email_quota_monthly,
        email_used_current_month: formData.email_used_current_month,
        email_quota_reset_date: formData.email_quota_reset_date,
        // Custom Branding
        branding_logo_url: formData.branding_logo_url,
        branding_primary_color: formData.branding_primary_color,
        branding_secondary_color: formData.branding_secondary_color,
        branding_app_name: formData.branding_app_name,
        branding_support_email: formData.branding_support_email,
        branding_support_phone: formData.branding_support_phone,
        // Security Settings - Password Policy
        password_min_length: formData.password_min_length,
        password_require_uppercase: formData.password_require_uppercase,
        password_require_lowercase: formData.password_require_lowercase,
        password_require_numbers: formData.password_require_numbers,
        password_require_special_chars: formData.password_require_special_chars,
        // Security Settings - MFA
        mfa_required: formData.mfa_required,
        // Security Settings - Session
        session_timeout_minutes: formData.session_timeout_minutes,
        session_absolute_timeout_minutes: formData.session_absolute_timeout_minutes,
        // Security Settings - Login Attempts
        max_login_attempts: formData.max_login_attempts,
        login_lockout_duration_minutes: formData.login_lockout_duration_minutes,
        login_notification_enabled: formData.login_notification_enabled,
        // Security Settings - IP Whitelisting
        ip_whitelist_enabled: formData.ip_whitelist_enabled,
      };

      const result = await updateMutation.mutateAsync({
        tenantId: selectedTenantId,
        settings: payload,
      });

      if (result.success) {
        // Log the settings update to audit log
        await logSettingsUpdate(selectedTenantId, payload);
        
        toast({
          title: 'تم الحفظ',
          description: 'تم تحديث إعدادات Tenant بنجاح',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'فشل الحفظ',
          description: result.message || 'حدث خطأ أثناء حفظ الإعدادات',
        });
      }
    } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: err.message || 'حدث خطأ غير متوقع',
        });
      }
    });
  };

  // Loading tenants
  if (tenantsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tenant Selector */}
      <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          اختيار Tenant
        </CardTitle>
        <CardDescription>
          اختر Tenant لإدارة إعداداته (يتطلب صلاحية super_admin)
        </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tenant-select">Tenant</Label>
            <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
              <SelectTrigger id="tenant-select">
                <SelectValue placeholder="اختر Tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenantsData?.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Settings Form */}
      {!selectedTenantId ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            الرجاء اختيار Tenant لعرض وتعديل إعداداته
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error || !response?.success ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {response?.message || 'فشل تحميل الإعدادات. حاول مرة أخرى.'}
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              إعدادات Tenant
            </CardTitle>
            <CardDescription>
              إدارة الإعدادات لـ Tenant المحدد
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* SLA Configuration */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">إعدادات SLA</h3>
                <p className="text-sm text-muted-foreground">
                  الحدود الزمنية لاتفاقيات مستوى الخدمة
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reminder_sla_hours">التذكيرات (ساعات)</Label>
                  <Input
                    id="reminder_sla_hours"
                    type="number"
                    min="1"
                    value={formData.reminder_sla_hours}
                    onChange={(e) => setFormData({ ...formData, reminder_sla_hours: parseInt(e.target.value) || 24 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report_sla_days">التقارير (أيام)</Label>
                  <Input
                    id="report_sla_days"
                    type="number"
                    min="1"
                    value={formData.report_sla_days}
                    onChange={(e) => setFormData({ ...formData, report_sla_days: parseInt(e.target.value) || 7 })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Feature Flags */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">تفعيل الميزات</h3>
                <p className="text-sm text-muted-foreground">
                  تمكين أو تعطيل ميزات البوابات
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable_gate_k">Gate-K (تحليلات KPI)</Label>
                    <p className="text-sm text-muted-foreground">تفعيل بوابة التحليلات والإحصائيات</p>
                  </div>
                  <Switch
                    id="enable_gate_k"
                    checked={formData.enable_gate_k}
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_gate_k: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable_gate_f">Gate-F (التقارير)</Label>
                    <p className="text-sm text-muted-foreground">تفعيل بوابة التقارير والتصدير</p>
                  </div>
                  <Switch
                    id="enable_gate_f"
                    checked={formData.enable_gate_f}
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_gate_f: checked })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Limits */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">حدود الموارد</h3>
                <p className="text-sm text-muted-foreground">
                  الحد الأقصى للموارد المسموح بها
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max_users">الحد الأقصى للمستخدمين</Label>
                  <Input
                    id="max_users"
                    type="number"
                    min="1"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 100 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_active_campaigns">الحد الأقصى للحملات النشطة</Label>
                  <Input
                    id="max_active_campaigns"
                    type="number"
                    min="1"
                    value={formData.max_active_campaigns}
                    onChange={(e) => setFormData({ ...formData, max_active_campaigns: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Notification Channels */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">قنوات الإشعارات</h3>
                <p className="text-sm text-muted-foreground">
                  تمكين قنوات الإشعارات المختلفة
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">إرسال الإشعارات عبر البريد الإلكتروني</p>
                  </div>
                  <Switch
                    id="email"
                    checked={formData.email}
                    onCheckedChange={(checked) => setFormData({ ...formData, email: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="slack">Slack</Label>
                    <p className="text-sm text-muted-foreground">إرسال الإشعارات عبر Slack</p>
                  </div>
                  <Switch
                    id="slack"
                    checked={formData.slack}
                    onCheckedChange={(checked) => setFormData({ ...formData, slack: checked })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Storage Limits */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">حدود التخزين</h3>
                <p className="text-sm text-muted-foreground">
                  إدارة مساحة التخزين المتاحة للمستأجر
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storage_limit_mb">الحد الأقصى للتخزين (ميجابايت)</Label>
                  <Input
                    id="storage_limit_mb"
                    type="number"
                    min="1"
                    value={formData.storage_limit_mb}
                    onChange={(e) => setFormData({ ...formData, storage_limit_mb: parseInt(e.target.value) || 5120 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.storage_limit_mb / 1024).toFixed(2)} جيجابايت
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage_used_mb">المستخدم حالياً (ميجابايت)</Label>
                  <Input
                    id="storage_used_mb"
                    type="number"
                    min="0"
                    value={formData.storage_used_mb}
                    onChange={(e) => setFormData({ ...formData, storage_used_mb: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.storage_used_mb / 1024).toFixed(2)} جيجابايت ({((formData.storage_used_mb / formData.storage_limit_mb) * 100).toFixed(1)}% مستخدم)
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* API Rate Limits */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">حدود استدعاء النظام (API)</h3>
                <p className="text-sm text-muted-foreground">
                  التحكم في عدد الطلبات المسموح بها
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="api_unlimited">وصول غير محدود</Label>
                    <p className="text-sm text-muted-foreground">السماح بطلبات غير محدودة</p>
                  </div>
                  <Switch
                    id="api_unlimited"
                    checked={formData.api_unlimited}
                    onCheckedChange={(checked) => setFormData({ ...formData, api_unlimited: checked })}
                  />
                </div>

                {!formData.api_unlimited && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="api_rate_limit_per_minute">الحد الأقصى في الدقيقة</Label>
                      <Input
                        id="api_rate_limit_per_minute"
                        type="number"
                        min="1"
                        value={formData.api_rate_limit_per_minute}
                        onChange={(e) => setFormData({ ...formData, api_rate_limit_per_minute: parseInt(e.target.value) || 100 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api_rate_limit_per_hour">الحد الأقصى في الساعة</Label>
                      <Input
                        id="api_rate_limit_per_hour"
                        type="number"
                        min="1"
                        value={formData.api_rate_limit_per_hour}
                        onChange={(e) => setFormData({ ...formData, api_rate_limit_per_hour: parseInt(e.target.value) || 5000 })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Email Quotas */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">حصص البريد الإلكتروني</h3>
                <p className="text-sm text-muted-foreground">
                  إدارة عدد الرسائل المسموح بها شهرياً
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="email_quota_monthly">الحصة الشهرية</Label>
                  <Input
                    id="email_quota_monthly"
                    type="number"
                    min="1"
                    value={formData.email_quota_monthly}
                    onChange={(e) => setFormData({ ...formData, email_quota_monthly: parseInt(e.target.value) || 1000 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_used_current_month">المستخدم هذا الشهر</Label>
                  <Input
                    id="email_used_current_month"
                    type="number"
                    min="0"
                    value={formData.email_used_current_month}
                    onChange={(e) => setFormData({ ...formData, email_used_current_month: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {((formData.email_used_current_month / formData.email_quota_monthly) * 100).toFixed(1)}% مستخدم
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_quota_reset_date">تاريخ إعادة التعيين</Label>
                  <Input
                    id="email_quota_reset_date"
                    type="date"
                    value={formData.email_quota_reset_date}
                    onChange={(e) => setFormData({ ...formData, email_quota_reset_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Custom Branding */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">العلامة التجارية المخصصة</h3>
                <p className="text-sm text-muted-foreground">
                  تخصيص شكل وهوية النظام للمستأجر
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="branding_app_name">اسم التطبيق</Label>
                  <Input
                    id="branding_app_name"
                    type="text"
                    value={formData.branding_app_name}
                    onChange={(e) => setFormData({ ...formData, branding_app_name: e.target.value })}
                    placeholder="Romuz Awareness"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="branding_logo_url">رابط الشعار</Label>
                    <Input
                      id="branding_logo_url"
                      type="url"
                      value={formData.branding_logo_url}
                      onChange={(e) => setFormData({ ...formData, branding_logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branding_support_email">بريد الدعم</Label>
                    <Input
                      id="branding_support_email"
                      type="email"
                      value={formData.branding_support_email}
                      onChange={(e) => setFormData({ ...formData, branding_support_email: e.target.value })}
                      placeholder="support@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="branding_support_phone">هاتف الدعم</Label>
                    <Input
                      id="branding_support_phone"
                      type="tel"
                      value={formData.branding_support_phone}
                      onChange={(e) => setFormData({ ...formData, branding_support_phone: e.target.value })}
                      placeholder="+966 12 345 6789"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branding_primary_color">اللون الأساسي (HSL)</Label>
                    <Input
                      id="branding_primary_color"
                      type="text"
                      value={formData.branding_primary_color}
                      onChange={(e) => setFormData({ ...formData, branding_primary_color: e.target.value })}
                      placeholder="hsl(222.2 47.4% 11.2%)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branding_secondary_color">اللون الثانوي (HSL)</Label>
                    <Input
                      id="branding_secondary_color"
                      type="text"
                      value={formData.branding_secondary_color}
                      onChange={(e) => setFormData({ ...formData, branding_secondary_color: e.target.value })}
                      placeholder="hsl(210 40% 96.1%)"
                    />
                  </div>
                </div>

                {(formData.branding_primary_color || formData.branding_secondary_color) && (
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-12 h-12 rounded border"
                        style={{ backgroundColor: formData.branding_primary_color }}
                      />
                      <span className="text-xs text-muted-foreground">الأساسي</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-12 h-12 rounded border"
                        style={{ backgroundColor: formData.branding_secondary_color }}
                      />
                      <span className="text-xs text-muted-foreground">الثانوي</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Security Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">إعدادات الأمان</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                سياسات الأمان والحماية للمستأجر
              </p>

              {/* Password Policy */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium text-foreground">سياسة كلمات المرور</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="password_min_length">الحد الأدنى لطول كلمة المرور</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    min="6"
                    max="128"
                    value={formData.password_min_length}
                    onChange={(e) => setFormData({ ...formData, password_min_length: parseInt(e.target.value) || 8 })}
                  />
                  <p className="text-xs text-muted-foreground">من 6 إلى 128 حرف</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="password_require_uppercase">يتطلب أحرف كبيرة (A-Z)</Label>
                      <p className="text-xs text-muted-foreground">حرف واحد على الأقل</p>
                    </div>
                    <Switch
                      id="password_require_uppercase"
                      checked={formData.password_require_uppercase}
                      onCheckedChange={(checked) => setFormData({ ...formData, password_require_uppercase: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="password_require_lowercase">يتطلب أحرف صغيرة (a-z)</Label>
                      <p className="text-xs text-muted-foreground">حرف واحد على الأقل</p>
                    </div>
                    <Switch
                      id="password_require_lowercase"
                      checked={formData.password_require_lowercase}
                      onCheckedChange={(checked) => setFormData({ ...formData, password_require_lowercase: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="password_require_numbers">يتطلب أرقام (0-9)</Label>
                      <p className="text-xs text-muted-foreground">رقم واحد على الأقل</p>
                    </div>
                    <Switch
                      id="password_require_numbers"
                      checked={formData.password_require_numbers}
                      onCheckedChange={(checked) => setFormData({ ...formData, password_require_numbers: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="password_require_special_chars">يتطلب رموز خاصة (!@#$)</Label>
                      <p className="text-xs text-muted-foreground">رمز واحد على الأقل</p>
                    </div>
                    <Switch
                      id="password_require_special_chars"
                      checked={formData.password_require_special_chars}
                      onCheckedChange={(checked) => setFormData({ ...formData, password_require_special_chars: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* MFA Settings */}
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-medium text-foreground">المصادقة متعددة العوامل (MFA)</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="mfa_required">يتطلب MFA لجميع المستخدمين</Label>
                    <p className="text-sm text-muted-foreground">إجباري للوصول إلى النظام</p>
                  </div>
                  <Switch
                    id="mfa_required"
                    checked={formData.mfa_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, mfa_required: checked })}
                  />
                </div>
              </div>

              {/* Session Settings */}
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-medium text-foreground">إعدادات الجلسة</h4>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="session_timeout_minutes">مهلة عدم النشاط (دقيقة)</Label>
                    <Input
                      id="session_timeout_minutes"
                      type="number"
                      min="5"
                      max="10080"
                      value={formData.session_timeout_minutes}
                      onChange={(e) => setFormData({ ...formData, session_timeout_minutes: parseInt(e.target.value) || 480 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      من 5 دقائق إلى أسبوع | القيمة الحالية: {(formData.session_timeout_minutes / 60).toFixed(1)} ساعة
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session_absolute_timeout_minutes">المهلة الإجمالية (دقيقة)</Label>
                    <Input
                      id="session_absolute_timeout_minutes"
                      type="number"
                      min="60"
                      max="43200"
                      value={formData.session_absolute_timeout_minutes}
                      onChange={(e) => setFormData({ ...formData, session_absolute_timeout_minutes: parseInt(e.target.value) || 1440 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      من ساعة إلى 30 يوم | القيمة الحالية: {(formData.session_absolute_timeout_minutes / 60 / 24).toFixed(1)} يوم
                    </p>
                  </div>
                </div>
              </div>

              {/* Login Attempt Settings */}
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-medium text-foreground">محاولات تسجيل الدخول</h4>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="max_login_attempts">الحد الأقصى للمحاولات الفاشلة</Label>
                    <Input
                      id="max_login_attempts"
                      type="number"
                      min="3"
                      max="20"
                      value={formData.max_login_attempts}
                      onChange={(e) => setFormData({ ...formData, max_login_attempts: parseInt(e.target.value) || 5 })}
                    />
                    <p className="text-xs text-muted-foreground">من 3 إلى 20 محاولة</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login_lockout_duration_minutes">مدة الحظر (دقيقة)</Label>
                    <Input
                      id="login_lockout_duration_minutes"
                      type="number"
                      min="5"
                      max="1440"
                      value={formData.login_lockout_duration_minutes}
                      onChange={(e) => setFormData({ ...formData, login_lockout_duration_minutes: parseInt(e.target.value) || 30 })}
                    />
                    <p className="text-xs text-muted-foreground">من 5 دقائق إلى 24 ساعة</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="login_notification_enabled">إشعار عند المحاولات الفاشلة</Label>
                    <p className="text-sm text-muted-foreground">إرسال تنبيه عند محاولات تسجيل دخول فاشلة</p>
                  </div>
                  <Switch
                    id="login_notification_enabled"
                    checked={formData.login_notification_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, login_notification_enabled: checked })}
                  />
                </div>
              </div>

              {/* IP Whitelisting */}
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-medium text-foreground">القائمة البيضاء للـ IP</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ip_whitelist_enabled">تفعيل القائمة البيضاء</Label>
                    <p className="text-sm text-muted-foreground">السماح فقط لعناوين IP محددة (متقدم)</p>
                  </div>
                  <Switch
                    id="ip_whitelist_enabled"
                    checked={formData.ip_whitelist_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, ip_whitelist_enabled: checked })}
                  />
                </div>
                {formData.ip_whitelist_enabled && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      لإدارة نطاقات IP المسموحة، يرجى استخدام واجهة إدارة الأمان المتقدمة
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </div>
          </CardContent>

          <RoleRequiredDialog
            open={roleProtection.showDialog}
            onOpenChange={roleProtection.setShowDialog}
            requiredRole="platform_admin"
            title="تأكيد حفظ الإعدادات"
            description="هذا الإجراء يتطلب دور platform_admin. الرجاء الاتصال بمدير النظام."
          />
        </Card>
      )}
    </div>
  );
}
