/**
 * M18: Incident Response - Reports & Analytics Page
 */

import { PageHeader } from '@/core/components/ui/page-header';
import { useTranslation } from 'react-i18next';

export default function IncidentReports() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRTL ? 'التقارير والتحليلات' : 'Reports & Analytics'}
        description={isRTL ? 'تقارير وتحليلات الحوادث الأمنية' : 'Security incident reports and analytics'}
      />

      <div className="text-muted-foreground">
        {isRTL ? 'التقارير والتحليلات ستظهر هنا' : 'Reports and analytics will appear here'}
      </div>
    </div>
  );
}
