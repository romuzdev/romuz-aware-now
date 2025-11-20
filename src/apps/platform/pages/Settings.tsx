import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Label } from "@/core/components/ui/label";
import { Switch } from "@/core/components/ui/switch";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Separator } from "@/core/components/ui/separator";
import { Bell, Lock, Globe, Moon, Database, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useAppContext } from "@/lib/app-context/AppContextProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMyProfile } from "@/core/tenancy/integration";
import { seedAwarenessTestData, clearTestData } from "@/integrations/supabase/test-data";
import { toast } from "sonner";
import { useState } from "react";

/**
 * Settings - صفحة الإعدادات
 * 
 * تحتوي على:
 * - إعدادات الإشعارات
 * - إعدادات الخصوصية والأمان
 * - تفضيلات العرض (الثيم واللغة)
 * - إعدادات الحساب
 */
export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user } = useAppContext();
  const queryClient = useQueryClient();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: fetchMyProfile,
    enabled: !!user,
  });

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedAwarenessTestData();
      toast.success(result.message);
      
      // Invalidate all awareness queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['awareness'] });
      queryClient.invalidateQueries({ queryKey: ['gate-h'] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      queryClient.invalidateQueries({ queryKey: ['gate-i-kpis'] });
    } catch (error: any) {
      toast.error(error.message || 'فشل في إنشاء البيانات التجريبية');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('هل أنت متأكد من حذف جميع البيانات التجريبية؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    setIsClearing(true);
    try {
      const result = await clearTestData();
      toast.success(result.message);
      
      // Invalidate all awareness queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['awareness'] });
      queryClient.invalidateQueries({ queryKey: ['gate-h'] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      queryClient.invalidateQueries({ queryKey: ['gate-i-kpis'] });
    } catch (error: any) {
      toast.error(error.message || 'فشل في حذف البيانات التجريبية');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('pages.settings.title', 'الإعدادات')}
        </h1>
        <p className="text-muted-foreground">
          {t('pages.settings.description', 'قم بإدارة إعدادات حسابك وتفضيلاتك')}
        </p>
      </div>

      {/* إعدادات الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t('pages.settings.notifications.title', 'الإشعارات')}
          </CardTitle>
          <CardDescription>
            {t('pages.settings.notifications.description', 'تحكم في كيفية تلقيك للإشعارات')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('pages.settings.notifications.email', 'إشعارات البريد الإلكتروني')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('pages.settings.notifications.emailDesc', 'استقبال الإشعارات عبر البريد الإلكتروني')}
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('pages.settings.notifications.campaigns', 'إشعارات الحملات')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('pages.settings.notifications.campaignsDesc', 'تلقي إشعارات عند بدء حملات جديدة')}
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('pages.settings.notifications.tasks', 'إشعارات المهام')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('pages.settings.notifications.tasksDesc', 'تنبيهات عند وجود مهام جديدة أو قريبة من الانتهاء')}
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الخصوصية والأمان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {t('pages.settings.security.title', 'الخصوصية والأمان')}
          </CardTitle>
          <CardDescription>
            {t('pages.settings.security.description', 'إدارة إعدادات الأمان والخصوصية')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">
              {t('pages.settings.security.currentPassword', 'كلمة المرور الحالية')}
            </Label>
            <Input 
              id="current-password" 
              type="password" 
              placeholder={t('pages.settings.security.enterCurrentPassword', 'أدخل كلمة المرور الحالية')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">
              {t('pages.settings.security.newPassword', 'كلمة المرور الجديدة')}
            </Label>
            <Input 
              id="new-password" 
              type="password" 
              placeholder={t('pages.settings.security.enterNewPassword', 'أدخل كلمة المرور الجديدة')}
            />
          </div>
          <Button>
            {t('pages.settings.security.updatePassword', 'تحديث كلمة المرور')}
          </Button>
        </CardContent>
      </Card>

      {/* تفضيلات العرض */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            {t('pages.settings.display.title', 'تفضيلات العرض')}
          </CardTitle>
          <CardDescription>
            {t('pages.settings.display.description', 'تخصيص شكل ومظهر التطبيق')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('pages.settings.display.darkMode', 'الوضع الداكن')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('pages.settings.display.darkModeDesc', 'تفعيل الوضع الداكن للعينين')}
              </p>
            </div>
            <Switch 
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('pages.settings.display.language', 'اللغة')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('pages.settings.display.languageDesc', 'اللغة الحالية: ' + (i18n.language === 'ar' ? 'العربية' : 'English'))}
              </p>
            </div>
            <Globe className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* معلومات الحساب */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.settings.account.title', 'معلومات الحساب')}</CardTitle>
          <CardDescription>
            {t('pages.settings.account.description', 'معلوماتك الشخصية في النظام')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('pages.settings.account.name', 'الاسم')}</Label>
            <Input value={profile?.full_name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>{t('pages.settings.account.email', 'البريد الإلكتروني')}</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('pages.settings.account.note', 'لتغيير معلومات حسابك، يرجى التواصل مع الدعم الفني')}
          </p>
        </CardContent>
      </Card>

      {/* إدارة البيانات التجريبية */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            البيانات التجريبية
          </CardTitle>
          <CardDescription>
            إنشاء وإدارة البيانات التجريبية لاختبار النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              استخدم هذه الأدوات لإنشاء بيانات تجريبية في تطبيق التوعية (Awareness) لاختبار النظام.
              تشمل البيانات التجريبية:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mr-4">
              <li>حملات توعية (3 حملات)</li>
              <li>سياسات (3 سياسات)</li>
              <li>لجان (2 لجنة)</li>
              <li>أهداف استراتيجية (2 هدف)</li>
              <li>مؤشرات أداء (2 مؤشر)</li>
              <li>مشاركين في الحملات (عينة)</li>
            </ul>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button
              onClick={handleSeedData}
              disabled={isSeeding || isClearing}
              className="flex-1"
            >
              <Database className="h-4 w-4 ml-2" />
              {isSeeding ? 'جاري الإنشاء...' : 'إنشاء بيانات تجريبية'}
            </Button>
            
            <Button
              onClick={handleClearData}
              disabled={isSeeding || isClearing}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              {isClearing ? 'جاري الحذف...' : 'حذف البيانات التجريبية'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            ⚠️ البيانات التجريبية مخصصة للاختبار فقط ويتم وسمها بعلامة "تجريبي"
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
