/**
 * M18: Incident Response - Active Incidents Page
 */

import { PageHeader } from '@/core/components/ui/page-header';
import { useTranslation } from 'react-i18next';

export default function ActiveIncidents() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRTL ? 'الحوادث النشطة' : 'Active Incidents'}
        description={isRTL ? 'عرض وإدارة الحوادث الأمنية النشطة' : 'View and manage active security incidents'}
      />

      <div className="text-muted-foreground">
        {isRTL ? 'قائمة الحوادث النشطة ستظهر هنا' : 'Active incidents list will appear here'}
      </div>
    </div>
  );
}
