/**
 * Predictive Analytics - Models Management
 */

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/ui/page-header';
import { Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';

export default function Models() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        title={t('Prediction Models', 'نماذج التنبؤ')}
        description={t('Manage AI prediction models', 'إدارة نماذج التنبؤ بالذكاء الاصطناعي')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('Available Models', 'النماذج المتاحة')}</CardTitle>
          <CardDescription>
            {t('Configure and train prediction models', 'تكوين وتدريب نماذج التنبؤ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            {t('No models configured yet.', 'لم يتم تكوين نماذج بعد.')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
