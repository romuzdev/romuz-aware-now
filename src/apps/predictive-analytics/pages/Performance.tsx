/**
 * Predictive Analytics - Performance Metrics
 */

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/ui/page-header';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';

export default function Performance() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title={t('Model Performance', 'أداء النماذج')}
        description={t('Track accuracy and effectiveness', 'تتبع الدقة والفعالية')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('Performance Metrics', 'مقاييس الأداء')}</CardTitle>
          <CardDescription>
            {t('Detailed performance analysis for all models', 'تحليل مفصّل للأداء لجميع النماذج')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            {t('No performance data available yet.', 'لا توجد بيانات أداء متاحة بعد.')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
