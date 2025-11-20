/**
 * Audit Report Generator
 * M12: Generate comprehensive audit reports in multiple formats
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Label } from '@/core/components/ui/label';
import { Checkbox } from '@/core/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Separator } from '@/core/components/ui/separator';
import { FileText, Download, Eye, Printer, CheckCircle2 } from 'lucide-react';
import { useAuditById, useAuditFindings } from '@/modules/grc/hooks/useAudits';
import { useGenerateAuditReport } from '@/modules/grc/hooks/useAuditWorkflows';
import type { AuditReportType, ReportFormat } from '@/modules/grc/types/audit-workflow.types';

interface AuditReportGeneratorProps {
  auditId: string;
}

const REPORT_TYPE_LABELS: Record<AuditReportType, { title: string; description: string }> = {
  executive: {
    title: 'تقرير تنفيذي',
    description: 'ملخص موجز للإدارة العليا مع النتائج الرئيسية والتوصيات',
  },
  detailed: {
    title: 'تقرير تفصيلي',
    description: 'تقرير شامل يتضمن جميع النتائج والأدلة والتوصيات',
  },
  findings_only: {
    title: 'تقرير النتائج فقط',
    description: 'قائمة بجميع النتائج والملاحظات دون التفاصيل الإضافية',
  },
  compliance_gap: {
    title: 'تحليل فجوات الامتثال',
    description: 'تحليل مفصل للفجوات بين الوضع الحالي ومتطلبات الامتثال',
  },
};

const FORMAT_LABELS: Record<ReportFormat, string> = {
  pdf: 'PDF',
  excel: 'Excel',
  word: 'Word',
  json: 'JSON',
};

export function AuditReportGenerator({ auditId }: AuditReportGeneratorProps) {
  const [reportType, setReportType] = useState<AuditReportType>('detailed');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeEvidence, setIncludeEvidence] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  const { data: audit, isLoading: auditLoading } = useAuditById(auditId);
  const { data: findings, isLoading: findingsLoading } = useAuditFindings({ audit_id: auditId });
  const generateReportMutation = useGenerateAuditReport();

  const handleGenerateReport = async () => {
    await generateReportMutation.mutateAsync({
      auditId,
      options: {
        type: reportType,
        format: reportFormat,
        include_charts: includeCharts,
        include_signatures: includeSignatures,
        include_evidence: includeEvidence,
        language,
      },
    });
  };

  if (auditLoading || findingsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>توليد تقرير التدقيق</CardTitle>
        <CardDescription>
          قم بإنشاء تقرير شامل بصيغ متعددة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Audit Info Summary */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">كود التدقيق</p>
                <p className="font-medium">{audit?.audit_code}</p>
              </div>
              <Badge>{audit?.audit_status}</Badge>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">عنوان التدقيق</p>
              <p className="font-medium">{audit?.audit_title_ar || audit?.audit_title}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي النتائج</p>
                <p className="text-2xl font-bold">{findings?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">حرجة</p>
                <p className="text-2xl font-bold text-red-600">
                  {findings?.filter(f => f.severity === 'critical').length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عالية</p>
                <p className="text-2xl font-bold text-orange-600">
                  {findings?.filter(f => f.severity === 'high').length || 0}
                </p>
              </div>
            </div>
          </div>

          <Tabs value={reportType} onValueChange={(v) => setReportType(v as AuditReportType)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="executive">تنفيذي</TabsTrigger>
              <TabsTrigger value="detailed">تفصيلي</TabsTrigger>
              <TabsTrigger value="findings_only">النتائج</TabsTrigger>
              <TabsTrigger value="compliance_gap">الفجوات</TabsTrigger>
            </TabsList>

            {Object.entries(REPORT_TYPE_LABELS).map(([key, { title, description }]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{title}</h4>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>صيغة التقرير</Label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(FORMAT_LABELS).map(([format, label]) => (
                <Button
                  key={format}
                  variant={reportFormat === format ? 'default' : 'outline'}
                  onClick={() => setReportFormat(format as ReportFormat)}
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 ml-2" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>خيارات التقرير</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="charts"
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                />
                <Label htmlFor="charts" className="cursor-pointer">
                  تضمين الرسوم البيانية والإحصائيات
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="signatures"
                  checked={includeSignatures}
                  onCheckedChange={(checked) => setIncludeSignatures(checked as boolean)}
                />
                <Label htmlFor="signatures" className="cursor-pointer">
                  تضمين التوقيعات الإلكترونية
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="evidence"
                  checked={includeEvidence}
                  onCheckedChange={(checked) => setIncludeEvidence(checked as boolean)}
                />
                <Label htmlFor="evidence" className="cursor-pointer">
                  تضمين الأدلة والمرفقات
                </Label>
              </div>
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <Label>لغة التقرير</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as 'ar' | 'en')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
              className="flex-1"
            >
              {generateReportMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 ml-2" />
                  إنشاء وتحميل التقرير
                </>
              )}
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 ml-2" />
              معاينة
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
          </div>

          {/* Success Message */}
          {generateReportMutation.isSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 dark:text-green-400">
                تم إنشاء التقرير بنجاح! يمكنك تحميله الآن.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
