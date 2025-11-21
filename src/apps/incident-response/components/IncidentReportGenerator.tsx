/**
 * M18: Incident Response System - Report Generator
 * Generate and export incident reports in multiple formats
 */

import React, { useState } from 'react';
import { FileDown, FileText, FileSpreadsheet, Loader2, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Label } from '@/core/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Separator } from '@/core/components/ui/separator';
import { useToast } from '@/core/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface IncidentReportGeneratorProps {
  incidents: any[];
  statistics?: any;
  className?: string;
}

type ReportType = 'summary' | 'detailed' | 'executive' | 'technical';
type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

interface ReportConfig {
  reportType: ReportType;
  exportFormat: ExportFormat;
  dateRange: string;
  includeCharts: boolean;
  includeTimeline: boolean;
  includeMetrics: boolean;
  includeResolution: boolean;
  severityFilter: string[];
  statusFilter: string[];
}

/**
 * Incident Report Generator Component
 */
export function IncidentReportGenerator({
  incidents,
  statistics,
  className,
}: IncidentReportGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({
    reportType: 'summary',
    exportFormat: 'pdf',
    dateRange: '30days',
    includeCharts: true,
    includeTimeline: false,
    includeMetrics: true,
    includeResolution: false,
    severityFilter: [],
    statusFilter: [],
  });

  /**
   * Generate report
   */
  const generateReport = async () => {
    setIsGenerating(true);

    try {
      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In production, this would call an API endpoint to generate the report
      // For now, we'll show a success message
      
      toast({
        title: '✅ تم إنشاء التقرير',
        description: `تم إنشاء تقرير ${getReportTypeName(config.reportType)} بصيغة ${getFormatName(config.exportFormat)}`,
      });

      // Here you would typically trigger a download
      // downloadReport(reportData, config.exportFormat);

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إنشاء التقرير. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Get report type name in Arabic
   */
  function getReportTypeName(type: ReportType): string {
    const names: Record<ReportType, string> = {
      summary: 'ملخص',
      detailed: 'تفصيلي',
      executive: 'تنفيذي',
      technical: 'تقني',
    };
    return names[type];
  }

  /**
   * Get format name in Arabic
   */
  function getFormatName(format: ExportFormat): string {
    const names: Record<ExportFormat, string> = {
      pdf: 'PDF',
      excel: 'Excel',
      csv: 'CSV',
      json: 'JSON',
    };
    return names[format];
  }

  /**
   * Get format icon
   */
  function getFormatIcon(format: ExportFormat) {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'excel':
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />;
      default:
        return <FileDown className="h-4 w-4" />;
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            إعدادات التقرير
          </CardTitle>
          <CardDescription>
            اختر نوع التقرير والبيانات المراد تضمينها
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type */}
          <div className="space-y-2">
            <Label>نوع التقرير</Label>
            <Select
              value={config.reportType}
              onValueChange={(value) =>
                setConfig({ ...config, reportType: value as ReportType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">تقرير ملخص</SelectItem>
                <SelectItem value="detailed">تقرير تفصيلي</SelectItem>
                <SelectItem value="executive">تقرير تنفيذي</SelectItem>
                <SelectItem value="technical">تقرير تقني</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {config.reportType === 'summary' && 'يتضمن إحصائيات عامة وأهم النقاط'}
              {config.reportType === 'detailed' && 'يتضمن جميع التفاصيل والخط الزمني'}
              {config.reportType === 'executive' && 'موجز للإدارة العليا مع التوصيات'}
              {config.reportType === 'technical' && 'تفاصيل تقنية عميقة مع الأدلة'}
            </p>
          </div>

          <Separator />

          {/* Date Range */}
          <div className="space-y-2">
            <Label>الفترة الزمنية</Label>
            <Select
              value={config.dateRange}
              onValueChange={(value) => setConfig({ ...config, dateRange: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">آخر 7 أيام</SelectItem>
                <SelectItem value="30days">آخر 30 يوم</SelectItem>
                <SelectItem value="90days">آخر 3 أشهر</SelectItem>
                <SelectItem value="year">آخر سنة</SelectItem>
                <SelectItem value="all">جميع الفترات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Include Options */}
          <div className="space-y-4">
            <Label>محتويات التقرير</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="include-charts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeCharts: checked as boolean })
                  }
                />
                <label
                  htmlFor="include-charts"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  تضمين الرسوم البيانية
                </label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="include-timeline"
                  checked={config.includeTimeline}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeTimeline: checked as boolean })
                  }
                />
                <label
                  htmlFor="include-timeline"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  تضمين الخط الزمني للأحداث
                </label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="include-metrics"
                  checked={config.includeMetrics}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeMetrics: checked as boolean })
                  }
                />
                <label
                  htmlFor="include-metrics"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  تضمين المقاييس والإحصائيات
                </label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="include-resolution"
                  checked={config.includeResolution}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeResolution: checked as boolean })
                  }
                />
                <label
                  htmlFor="include-resolution"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  تضمين تفاصيل الحل والدروس المستفادة
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            صيغة التصدير
          </CardTitle>
          <CardDescription>اختر الصيغة المناسبة للتقرير</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['pdf', 'excel', 'csv', 'json'] as ExportFormat[]).map((format) => (
              <Button
                key={format}
                variant={config.exportFormat === format ? 'default' : 'outline'}
                className="h-auto flex-col gap-2 p-4"
                onClick={() => setConfig({ ...config, exportFormat: format })}
              >
                {getFormatIcon(format)}
                <span className="text-sm font-medium">{getFormatName(format)}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview Info */}
      <Card>
        <CardHeader>
          <CardTitle>معاينة التقرير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">نوع التقرير:</span>
              <p className="font-medium">{getReportTypeName(config.reportType)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">صيغة التصدير:</span>
              <p className="font-medium">{getFormatName(config.exportFormat)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">عدد الحوادث:</span>
              <p className="font-medium">{incidents.length} حادث</p>
            </div>
            <div>
              <span className="text-muted-foreground">الفترة الزمنية:</span>
              <p className="font-medium">
                {config.dateRange === '7days' && 'آخر 7 أيام'}
                {config.dateRange === '30days' && 'آخر 30 يوم'}
                {config.dateRange === '90days' && 'آخر 3 أشهر'}
                {config.dateRange === 'year' && 'آخر سنة'}
                {config.dateRange === 'all' && 'جميع الفترات'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              سيتم إنشاء التقرير وتنزيله تلقائياً
            </p>
            <Button
              onClick={generateReport}
              disabled={isGenerating}
              size="lg"
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  إنشاء التقرير
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Templates */}
      <Card>
        <CardHeader>
          <CardTitle>قوالب سريعة</CardTitle>
          <CardDescription>قوالب تقارير جاهزة للاستخدام المباشر</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                setConfig({
                  ...config,
                  reportType: 'summary',
                  exportFormat: 'pdf',
                  includeCharts: true,
                  includeMetrics: true,
                });
                toast({
                  title: 'تم تطبيق القالب',
                  description: 'تقرير ملخص شهري مع الرسوم البيانية',
                });
              }}
            >
              <div className="text-right space-y-1">
                <p className="font-semibold">تقرير شهري سريع</p>
                <p className="text-xs text-muted-foreground">
                  ملخص + رسوم بيانية + PDF - جاهز للمشاركة
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                setConfig({
                  ...config,
                  reportType: 'detailed',
                  exportFormat: 'excel',
                  includeTimeline: true,
                  includeMetrics: true,
                  includeResolution: true,
                });
                toast({
                  title: 'تم تطبيق القالب',
                  description: 'تقرير تفصيلي كامل مع جميع البيانات',
                });
              }}
            >
              <div className="text-right space-y-1">
                <p className="font-semibold">تقرير تفصيلي كامل</p>
                <p className="text-xs text-muted-foreground">
                  جميع التفاصيل + Excel - للتحليل المتقدم
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                setConfig({
                  ...config,
                  reportType: 'executive',
                  exportFormat: 'pdf',
                  includeCharts: true,
                  includeMetrics: true,
                });
                toast({
                  title: 'تم تطبيق القالب',
                  description: 'تقرير تنفيذي للإدارة العليا',
                });
              }}
            >
              <div className="text-right space-y-1">
                <p className="font-semibold">تقرير الإدارة العليا</p>
                <p className="text-xs text-muted-foreground">
                  ملخص تنفيذي + توصيات - جاهز للعرض
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
