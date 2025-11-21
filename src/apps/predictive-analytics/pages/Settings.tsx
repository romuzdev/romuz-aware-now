/**
 * Predictive Analytics - Settings
 */

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/ui/page-header';
import { Settings as SettingsIcon, Database, Sparkles, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { useInitializeModels, useSeedData } from '@/modules/analytics/hooks/usePredictiveAnalytics';

export default function Settings() {
  const { t } = useTranslation();
  const initModels = useInitializeModels();
  const seedData = useSeedData();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SettingsIcon}
        title={t('Settings', 'الإعدادات')}
        description={t('Configure predictive analytics', 'تكوين التحليلات التنبؤية')}
      />

      {/* Model Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle>{t('Model Management', 'إدارة النماذج')}</CardTitle>
          </div>
          <CardDescription>
            {t('Initialize and manage prediction models', 'تهيئة وإدارة نماذج التنبؤ')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium mb-1">
                {t('Initialize Default Models', 'تهيئة النماذج الافتراضية')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('Create default prediction models for all supported types', 'إنشاء نماذج تنبؤ افتراضية لجميع الأنواع المدعومة')}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">Risk</Badge>
                <Badge variant="outline">Incident</Badge>
                <Badge variant="outline">Compliance</Badge>
                <Badge variant="outline">Campaign</Badge>
                <Badge variant="outline">Audit</Badge>
                <Badge variant="outline">Breach</Badge>
              </div>
            </div>
            <Button
              onClick={() => initModels.mutate()}
              disabled={initModels.isPending}
            >
              {initModels.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {t('Initialize', 'تهيئة')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>{t('Data Management', 'إدارة البيانات')}</CardTitle>
          </div>
          <CardDescription>
            {t('Manage prediction data and samples', 'إدارة بيانات التنبؤ والعينات')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium mb-1">
                {t('Generate Sample Data', 'إنشاء بيانات تجريبية')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('Create sample predictions and performance metrics for testing', 'إنشاء تنبؤات تجريبية ومقاييس أداء للاختبار')}
              </p>
              <div className="flex gap-2 mt-2 text-sm text-muted-foreground">
                <span>• 10 predictions per model</span>
                <span>• Performance metrics</span>
                <span>• Validation samples</span>
              </div>
            </div>
            <Button
              onClick={() => seedData.mutate()}
              disabled={seedData.isPending}
            >
              {seedData.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {t('Generate', 'إنشاء')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t('AI Configuration', 'تكوين الذكاء الاصطناعي')}</CardTitle>
          <CardDescription>
            {t('Configure AI models and providers', 'تكوين نماذج ومزودي الذكاء الاصطناعي')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{t('Lovable AI Gateway', 'بوابة Lovable AI')}</h4>
              <Badge className="bg-green-500/10 text-green-500">
                {t('Active', 'نشط')}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Primary Model', 'النموذج الأساسي')}</span>
                <span className="font-medium">google/gemini-2.5-flash</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Advanced Model', 'النموذج المتقدم')}</span>
                <span className="font-medium">google/gemini-2.5-pro</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Status', 'الحالة')}</span>
                <span className="text-green-500">{t('Connected', 'متصل')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Performance Settings', 'إعدادات الأداء')}</CardTitle>
          <CardDescription>
            {t('Configure performance tracking and metrics', 'تكوين تتبع الأداء والمقاييس')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('Automatic Validation', 'التحقق التلقائي')}</span>
              <Badge variant="outline">{t('Disabled', 'معطل')}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('Performance Tracking', 'تتبع الأداء')}</span>
              <Badge className="bg-green-500/10 text-green-500">{t('Enabled', 'مفعل')}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('Metrics Retention', 'الاحتفاظ بالمقاييس')}</span>
              <span>90 {t('days', 'يوم')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
