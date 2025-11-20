/**
 * M18: Incident Response - Settings Page
 */

import { PageHeader } from '@/core/components/ui/page-header';
import { useTranslation } from 'react-i18next';

export default function IncidentSettings() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRTL ? 'إعدادات الاستجابة للحوادث' : 'Incident Response Settings'}
        description={isRTL ? 'تكوين إعدادات النظام والإشعارات' : 'Configure system settings and notifications'}
      />

      <div className="text-muted-foreground">
        {isRTL ? 'الإعدادات ستظهر هنا' : 'Settings will appear here'}
      </div>
    </div>
  );
}
