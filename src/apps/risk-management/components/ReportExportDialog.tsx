/**
 * Report Export Dialog Component
 * Dialog for exporting reports in various formats
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Label } from '@/core/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Input } from '@/core/components/ui/input';
import { useGenerateRiskSummary, useExportReport } from '@/modules/grc/hooks/useReports';
import type { ExportFormat, ReportConfig } from '@/modules/grc/types/report.types';
import { FileText, FileSpreadsheet, FileDown, FileJson } from 'lucide-react';

interface ReportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportExportDialog: React.FC<ReportExportDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [fileName, setFileName] = useState('');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);

  const generateReport = useGenerateRiskSummary();
  const exportReport = useExportReport();

  const handleExport = async () => {
    try {
      // Generate report config
      const config: ReportConfig = {
        type: 'risk_summary',
        title: 'تقرير ملخص المخاطر',
        includeCharts,
        includeDetails: includeRawData,
      };

      // Generate report data
      const reportData = await generateReport.mutateAsync(config);

      // Export report
      await exportReport.mutateAsync({
        reportData,
        options: {
          format,
          fileName: fileName || `grc-report-${Date.now()}`,
          includeCharts,
          includeRawData,
        },
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const isLoading = generateReport.isPending || exportReport.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تصدير التقرير</DialogTitle>
          <DialogDescription>
            اختر صيغة التصدير والإعدادات المطلوبة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>صيغة التصدير</Label>
            <RadioGroup value={format} onValueChange={(value: ExportFormat) => setFormat(value)}>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  <span>PDF</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileDown className="h-4 w-4" />
                  <span>CSV</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <FileJson className="h-4 w-4" />
                  <span>JSON</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* File Name */}
          <div className="space-y-2">
            <Label htmlFor="fileName">اسم الملف (اختياري)</Label>
            <Input
              id="fileName"
              placeholder="grc-report"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>خيارات التصدير</Label>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="includeCharts"
                checked={includeCharts}
                onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
              />
              <Label htmlFor="includeCharts" className="cursor-pointer">
                تضمين المخططات والرسوم البيانية
              </Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="includeRawData"
                checked={includeRawData}
                onCheckedChange={(checked) => setIncludeRawData(checked as boolean)}
              />
              <Label htmlFor="includeRawData" className="cursor-pointer">
                تضمين البيانات التفصيلية
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            إلغاء
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading ? 'جاري التصدير...' : 'تصدير'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
