/**
 * M22 - Advanced Admin Settings
 * Enhanced branding, security, and system configuration
 */

import { useState } from 'react';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import {
  Palette,
  Shield,
  Settings as SettingsIcon,
  AlertTriangle,
  Code,
  Mail,
} from 'lucide-react';
import {
  useAdminSettings,
  useUpdateBrandingSettings,
  useUpdateSecuritySettings,
  useSetMaintenanceMode,
  useUpdateFeatureFlags,
} from '@/modules/admin/hooks';
import { useAppContext } from '@/lib/app-context/AppContextProvider';

export default function AdvancedSettings() {
  const [activeTab, setActiveTab] = useState('branding');
  const { tenantId } = useAppContext();
  
  const { data: settings, isLoading } = useAdminSettings(tenantId || '');
  const updateBranding = useUpdateBrandingSettings();
  const updateSecurity = useUpdateSecuritySettings();
  const setMaintenance = useSetMaintenanceMode();
  const updateFeatures = useUpdateFeatureFlags();

  // Branding form state
  const [brandingForm, setBrandingForm] = useState({
    app_name: '',
    logo_url: '',
    primary_color: '',
    secondary_color: '',
    support_email: '',
    support_phone: '',
    custom_css: '',
  });

  // Security form state
  const [securityForm, setSecurityForm] = useState({
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_special_chars: true,
    session_timeout_minutes: 30,
    mfa_required: false,
    ip_whitelist_enabled: false,
  });

  // Maintenance mode state
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // Update form when settings load
  React.useEffect(() => {
    if (settings) {
      setBrandingForm({
        app_name: settings.branding_app_name || '',
        logo_url: settings.branding_logo_url || '',
        primary_color: settings.branding_primary_color || '',
        secondary_color: settings.branding_secondary_color || '',
        support_email: settings.branding_support_email || '',
        support_phone: settings.branding_support_phone || '',
        custom_css: settings.custom_css || '',
      });

      setSecurityForm({
        password_min_length: settings.password_min_length || 8,
        password_require_uppercase: settings.password_require_uppercase || false,
        password_require_lowercase: settings.password_require_lowercase || false,
        password_require_numbers: settings.password_require_numbers || false,
        password_require_special_chars: settings.password_require_special_chars || false,
        session_timeout_minutes: settings.session_timeout_minutes || 30,
        mfa_required: settings.mfa_required || false,
        ip_whitelist_enabled: false,
      });

      setMaintenanceEnabled(settings.maintenance_mode || false);
      setMaintenanceMessage(settings.maintenance_message || '');
    }
  }, [settings]);

  const handleSaveBranding = () => {
    if (!tenantId) return;
    updateBranding.mutate({
      tenantId,
      branding: brandingForm,
    });
  };

  const handleSaveSecurity = () => {
    if (!tenantId) return;
    updateSecurity.mutate({
      tenantId,
      security: securityForm,
    });
  };

  const handleToggleMaintenance = () => {
    if (!tenantId) return;
    setMaintenance.mutate({
      tenantId,
      enabled: !maintenanceEnabled,
      message: maintenanceMessage,
    });
    setMaintenanceEnabled(!maintenanceEnabled);
  };

  if (!tenantId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">الرجاء تحديد عميل أولاً</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">جاري التحميل...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">الإعدادات المتقدمة</h1>
        <p className="text-muted-foreground">تخصيص العلامة التجارية والأمان والميزات</p>
      </div>

      {/* Maintenance Mode Alert */}
      {maintenanceEnabled && (
        <Card className="border-yellow-500 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="font-medium text-yellow-900">وضع الصيانة نشط</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="branding">العلامة التجارية</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="system">النظام</TabsTrigger>
          <TabsTrigger value="features">الميزات</TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                إعدادات العلامة التجارية
              </CardTitle>
              <CardDescription>تخصيص مظهر وهوية التطبيق</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="app_name">اسم التطبيق</Label>
                  <Input
                    id="app_name"
                    value={brandingForm.app_name}
                    onChange={(e) => setBrandingForm({ ...brandingForm, app_name: e.target.value })}
                    placeholder="منصة رموز للتوعية"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">رابط الشعار</Label>
                  <Input
                    id="logo_url"
                    value={brandingForm.logo_url}
                    onChange={(e) => setBrandingForm({ ...brandingForm, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_color">اللون الأساسي</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={brandingForm.primary_color}
                      onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={brandingForm.primary_color}
                      onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_color">اللون الثانوي</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={brandingForm.secondary_color}
                      onChange={(e) => setBrandingForm({ ...brandingForm, secondary_color: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={brandingForm.secondary_color}
                      onChange={(e) => setBrandingForm({ ...brandingForm, secondary_color: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support_email">البريد الإلكتروني للدعم</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={brandingForm.support_email}
                    onChange={(e) => setBrandingForm({ ...brandingForm, support_email: e.target.value })}
                    placeholder="support@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support_phone">رقم هاتف الدعم</Label>
                  <Input
                    id="support_phone"
                    type="tel"
                    value={brandingForm.support_phone}
                    onChange={(e) => setBrandingForm({ ...brandingForm, support_phone: e.target.value })}
                    placeholder="+966 XX XXX XXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_css">CSS مخصص</Label>
                <Textarea
                  id="custom_css"
                  value={brandingForm.custom_css}
                  onChange={(e) => setBrandingForm({ ...brandingForm, custom_css: e.target.value })}
                  placeholder="/* أضف CSS مخصص هنا */"
                  className="font-mono text-sm min-h-[200px]"
                />
              </div>

              <Button onClick={handleSaveBranding} disabled={updateBranding.isPending}>
                {updateBranding.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إعدادات الأمان
              </CardTitle>
              <CardDescription>إدارة سياسات كلمات المرور والجلسات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password Policy */}
              <div className="space-y-4">
                <h3 className="font-medium">سياسة كلمات المرور</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password_min_length">الحد الأدنى للطول</Label>
                    <Input
                      id="password_min_length"
                      type="number"
                      min="6"
                      max="32"
                      value={securityForm.password_min_length}
                      onChange={(e) => setSecurityForm({ ...securityForm, password_min_length: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require_uppercase">يتطلب أحرف كبيرة</Label>
                    <Switch
                      id="require_uppercase"
                      checked={securityForm.password_require_uppercase}
                      onCheckedChange={(checked) => setSecurityForm({ ...securityForm, password_require_uppercase: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require_lowercase">يتطلب أحرف صغيرة</Label>
                    <Switch
                      id="require_lowercase"
                      checked={securityForm.password_require_lowercase}
                      onCheckedChange={(checked) => setSecurityForm({ ...securityForm, password_require_lowercase: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require_numbers">يتطلب أرقام</Label>
                    <Switch
                      id="require_numbers"
                      checked={securityForm.password_require_numbers}
                      onCheckedChange={(checked) => setSecurityForm({ ...securityForm, password_require_numbers: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require_special">يتطلب رموز خاصة</Label>
                    <Switch
                      id="require_special"
                      checked={securityForm.password_require_special_chars}
                      onCheckedChange={(checked) => setSecurityForm({ ...securityForm, password_require_special_chars: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Session Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">إعدادات الجلسة</h3>
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">انتهاء الجلسة (دقائق)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={securityForm.session_timeout_minutes}
                    onChange={(e) => setSecurityForm({ ...securityForm, session_timeout_minutes: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <Separator />

              {/* MFA Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">المصادقة الثنائية</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mfa_required">إلزامية للجميع</Label>
                  <Switch
                    id="mfa_required"
                    checked={securityForm.mfa_required}
                    onCheckedChange={(checked) => setSecurityForm({ ...securityForm, mfa_required: checked })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSecurity} disabled={updateSecurity.isPending}>
                {updateSecurity.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                إعدادات النظام
              </CardTitle>
              <CardDescription>إدارة وضع الصيانة والإعدادات العامة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Maintenance Mode */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="maintenance_mode">وضع الصيانة</Label>
                    <p className="text-sm text-muted-foreground">
                      عند التفعيل، سيظهر للمستخدمين رسالة صيانة
                    </p>
                  </div>
                  <Switch
                    id="maintenance_mode"
                    checked={maintenanceEnabled}
                    onCheckedChange={handleToggleMaintenance}
                  />
                </div>

                {maintenanceEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_message">رسالة الصيانة</Label>
                    <Textarea
                      id="maintenance_message"
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="النظام قيد الصيانة، سنعود قريباً..."
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                إدارة الميزات
              </CardTitle>
              <CardDescription>تفعيل أو تعطيل ميزات النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>حملات التوعية</Label>
                    <p className="text-sm text-muted-foreground">إدارة الحملات والمشاركين</p>
                  </div>
                  <Badge>نشط</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>محاكاة التصيد</Label>
                    <p className="text-sm text-muted-foreground">محاكاة هجمات التصيد الاحتيالي</p>
                  </div>
                  <Badge>نشط</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>إدارة الحوادث</Label>
                    <p className="text-sm text-muted-foreground">تتبع وإدارة الحوادث الأمنية</p>
                  </div>
                  <Badge>نشط</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>التحليلات المتقدمة</Label>
                    <p className="text-sm text-muted-foreground">تقارير وتحليلات تفصيلية</p>
                  </div>
                  <Badge variant="secondary">قريباً</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
