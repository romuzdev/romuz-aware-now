/**
 * M18: Incident Response - Incident Details Page
 */

import { useParams } from 'react-router-dom';
import { PageHeader } from '@/core/components/ui/page-header';
import { useTranslation } from 'react-i18next';

export default function IncidentDetails() {
  const { id } = useParams<{ id: string }>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRTL ? `تفاصيل الحادثة #${id}` : `Incident Details #${id}`}
        description={isRTL ? 'معلومات تفصيلية عن الحادثة والجدول الزمني' : 'Detailed incident information and timeline'}
      />

      <div className="text-muted-foreground">
        {isRTL ? 'تفاصيل الحادثة ستظهر هنا' : 'Incident details will appear here'}
      </div>
    </div>
  );
}
