/**
 * GRC Reports Page
 * Comprehensive reporting suite for GRC module
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';
import { 
  useGenerateRiskSummary,
  useHeatMapData,
  useRiskTrendAnalysis,
  useControlPerformanceReport,
  useExportReport
} from '@/modules/grc/hooks';
import type { ReportConfig, ExportFormat } from '@/modules/grc/types';

export default function GRCReports() {
  const [reportType, setReportType] = useState<'risk_summary' | 'risk_heat_map' | 'control_effectiveness'>('risk_summary');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');

  const generateRiskSummary = useGenerateRiskSummary();
  const { data: heatMapData } = useHeatMapData();
  const { data: trendData } = useRiskTrendAnalysis(period, 6);
  const { data: controlPerformance } = useControlPerformanceReport();
  const exportReport = useExportReport();

  const handleGenerateReport = async () => {
    const config: ReportConfig = {
      type: reportType,
      title: `تقرير ${getReportTitle(reportType)}`,
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
      includeCharts: true,
      includeDetails: true,
    };

    const reportData = await generateRiskSummary.mutateAsync(config);
    
    if (reportData) {
      await exportReport.mutateAsync({
        reportData,
        options: {
          format: exportFormat,
          fileName: `grc-report-${Date.now()}`,
          includeCharts: true,
          includeDetails: true,
        },
      });
    }
  };

  const getReportTitle = (type: string) => {
    const titles: Record<string, string> = {
      risk_summary: 'ملخص المخاطر',
      risk_heat_map: 'خريطة المخاطر الحرارية',
      control_effectiveness: 'فعالية الضوابط',
      treatment_progress: 'تقدم المعالجة',
      risk_trends: 'اتجاهات المخاطر',
      compliance_status: 'حالة الامتثال',
      executive_summary: 'الملخص التنفيذي',
    };
    return titles[type] || type;
  };

  const reportTemplates = [
    {
      id: 'risk_summary',
      title: 'ملخص المخاطر',
      description: 'نظرة شاملة على جميع المخاطر وحالتها',
      icon: AlertTriangle,
      color: 'text-orange-500',
    },
    {
      id: 'risk_heat_map',
      title: 'خريطة المخاطر الحرارية',
      description: 'تصور المخاطر حسب الاحتمالية والتأثير',
      icon: BarChart3,
      color: 'text-red-500',
    },
    {
      id: 'control_effectiveness',
      title: 'فعالية الضوابط',
      description: 'تقييم أداء الضوابط الأمنية',
      icon: Shield,
      color: 'text-green-500',
    },
    {
      id: 'risk_trends',
      title: 'اتجاهات المخاطر',
      description: 'تحليل اتجاهات المخاطر عبر الزمن',
      icon: TrendingUp,
      color: 'text-blue-500',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تقارير GRC</h1>
          <p className="text-muted-foreground mt-2">
            إنشاء وتصدير تقارير شاملة للحوكمة والمخاطر والامتثال
          </p>
        </div>
        <Button onClick={handleGenerateReport} disabled={generateRiskSummary.isPending}>
          <Download className="ml-2 h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">قوالب التقارير</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="scheduled">التقارير المجدولة</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التقرير</CardTitle>
              <CardDescription>اختر نوع التقرير وصيغة التصدير</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">نوع التقرير</label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="risk_summary">ملخص المخاطر</SelectItem>
                      <SelectItem value="risk_heat_map">خريطة المخاطر</SelectItem>
                      <SelectItem value="control_effectiveness">فعالية الضوابط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">صيغة التصدير</label>
                  <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setReportType(template.id as any)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <template.icon className={`h-5 w-5 ${template.color}`} />
                      {template.title}
                    </CardTitle>
                    {reportType === template.id && (
                      <Badge variant="default">محدد</Badge>
                    )}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Control Performance */}
          {controlPerformance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  أداء الضوابط
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{controlPerformance.totalControls}</p>
                    <p className="text-sm text-muted-foreground">إجمالي الضوابط</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{controlPerformance.testedControls}</p>
                    <p className="text-sm text-muted-foreground">الضوابط المختبرة</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-500">{controlPerformance.effectiveRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">معدل الفعالية</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">{controlPerformance.overdue}</p>
                    <p className="text-sm text-muted-foreground">متأخرة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Trends */}
          {trendData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  اتجاهات المخاطر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">الاتجاه العام</span>
                    <Badge variant={trendData.insights.trend === 'decreasing' ? 'default' : 'destructive'}>
                      {trendData.insights.trend === 'increasing' ? 'متزايد' : 
                       trendData.insights.trend === 'decreasing' ? 'متناقص' : 'مستقر'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">نسبة التغيير</span>
                    <span className="text-sm font-medium">{trendData.insights.percentChange.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                التقارير المجدولة
              </CardTitle>
              <CardDescription>جدولة التقارير للتوليد والإرسال التلقائي</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد تقارير مجدولة حالياً</p>
                <Button className="mt-4" variant="outline">
                  إنشاء جدول جديد
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
