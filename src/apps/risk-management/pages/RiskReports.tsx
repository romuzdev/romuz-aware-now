/**
 * Risk Reports Page
 * Generate and export risk management reports
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { ReportExportDialog } from '../components';
import { useRisks } from '@/modules/grc/hooks';

export default function RiskReports() {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { data: risks } = useRisks();

  const reportTypes = [
    {
      id: 'risk-register',
      title: 'سجل المخاطر الكامل',
      description: 'تقرير شامل بجميع المخاطر المسجلة',
      icon: FileText,
    },
    {
      id: 'high-risks',
      title: 'المخاطر عالية التأثير',
      description: 'تقرير بالمخاطر الحرجة والعالية فقط',
      icon: FileText,
    },
    {
      id: 'risk-trends',
      title: 'تقرير الاتجاهات',
      description: 'تحليل الاتجاهات التاريخية للمخاطر',
      icon: FileText,
    },
    {
      id: 'risk-treatment',
      title: 'خطط المعالجة',
      description: 'تقرير بخطط معالجة المخاطر وحالتها',
      icon: FileText,
    },
    {
      id: 'risk-matrix',
      title: 'مصفوفة المخاطر',
      description: 'تمثيل مرئي لتوزيع المخاطر',
      icon: FileText,
    },
    {
      id: 'executive-summary',
      title: 'ملخص تنفيذي',
      description: 'نظرة عامة للإدارة العليا',
      icon: FileText,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">تقارير المخاطر</h1>
        <p className="text-muted-foreground">
          إنشاء وتصدير تقارير إدارة المخاطر
        </p>
      </div>

      {/* Quick Export */}
      <Card>
        <CardHeader>
          <CardTitle>تصدير سريع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={() => setExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              تصدير سجل المخاطر (Excel)
            </Button>
            <p className="text-sm text-muted-foreground">
              {risks?.length || 0} مخاطرة متاحة للتصدير
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">قوالب التقارير</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        {report.description}
                      </p>
                    </div>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setExportDialogOpen(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    إنشاء التقرير
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Export Dialog */}
      <ReportExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />
    </div>
  );
}
