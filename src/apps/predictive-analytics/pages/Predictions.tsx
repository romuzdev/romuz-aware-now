/**
 * Predictive Analytics - Predictions List
 */

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/ui/page-header';
import { Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';

export default function Predictions() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Brain}
        title={t('Predictions', 'التنبؤات')}
        description={t('View and manage all predictions', 'عرض وإدارة جميع التنبؤات')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('All Predictions', 'جميع التنبؤات')}</CardTitle>
          <CardDescription>
            {t('History of all prediction requests and results', 'سجل جميع طلبات ونتائج التنبؤات')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            {t('No predictions yet.', 'لا توجد تنبؤات بعد.')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
