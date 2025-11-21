/**
 * Predictive Analytics - Settings
 */

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/ui/page-header';
import { Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';

export default function Settings() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SettingsIcon}
        title={t('Settings', 'الإعدادات')}
        description={t('Configure predictive analytics', 'تكوين التحليلات التنبؤية')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('General Settings', 'الإعدادات العامة')}</CardTitle>
          <CardDescription>
            {t('Configure global settings for predictive analytics', 'تكوين الإعدادات العامة للتحليلات التنبؤية')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            {t('Settings will be available soon.', 'ستتوفر الإعدادات قريباً.')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
