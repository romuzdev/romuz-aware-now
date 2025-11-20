/**
 * BulkImportDialog - Advanced Bulk Import Component
 * Gate-M: CSV/Excel import with validation and preview
 */

import { useState } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
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
import { Input } from '@/core/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Progress } from '@/core/components/ui/progress';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { importTermsCSV, bulkCreateMappings } from '@/modules/master-data/integration';
import { useToast } from '@/hooks/use-toast';
import type { CreateMappingInput } from '@/modules/master-data/types';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'terms' | 'mappings';
  catalogId?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function BulkImportDialog({
  open,
  onOpenChange,
  entityType,
  catalogId,
}: BulkImportDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidationErrors([]);
    setImportResult(null);
    setIsValidating(true);

    try {
      const text = await selectedFile.text();
      const rows = text
        .split('\n')
        .map(line => line.split(',').map(cell => cell.trim()))
        .filter(row => row.length > 1);

      const headers = rows[0];
      const data = rows.slice(1).map((row, idx) => {
        const obj: any = { _rowNumber: idx + 2 };
        headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });

      setPreviewData(data.slice(0, 10));

      // Validate
      const errors: ValidationError[] = [];
      if (entityType === 'terms') {
        data.forEach((row, idx) => {
          if (!row.code) errors.push({ row: idx + 2, field: 'code', message: 'مطلوب' });
          if (!row.label_ar) errors.push({ row: idx + 2, field: 'label_ar', message: 'مطلوب' });
          if (!row.label_en) errors.push({ row: idx + 2, field: 'label_en', message: 'مطلوب' });
        });
      } else if (entityType === 'mappings') {
        data.forEach((row, idx) => {
          if (!row.source_system) errors.push({ row: idx + 2, field: 'source_system', message: 'مطلوب' });
          if (!row.src_code) errors.push({ row: idx + 2, field: 'src_code', message: 'مطلوب' });
          if (!row.target_code) errors.push({ row: idx + 2, field: 'target_code', message: 'مطلوب' });
        });
      }

      setValidationErrors(errors);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل قراءة الملف',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file || !catalogId) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const text = await file.text();
      const rows = text
        .split('\n')
        .map(line => line.split(',').map(cell => cell.trim()))
        .filter(row => row.length > 1);

      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });

      if (entityType === 'terms') {
        const result = await importTermsCSV({
          catalogId,
          rows: data.map(row => ({
            code: row.code,
            label_ar: row.label_ar,
            label_en: row.label_en,
            parent_code: row.parent_code || undefined,
            sort_order: parseInt(row.sort_order) || 0,
            active: row.active !== 'false',
            attrs: row.attrs ? JSON.parse(row.attrs) : {},
          })),
        });
        setImportResult(result);
      } else if (entityType === 'mappings') {
        const mappings: CreateMappingInput[] = data.map(row => ({
          catalogId,
          termId: row.term_id || null,
          sourceSystem: row.source_system,
          srcCode: row.src_code,
          targetCode: row.target_code,
          notes: row.notes || null,
        }));

        await bulkCreateMappings(mappings);
        setImportResult({ status: 'OK', inserted: mappings.length });
      }

      setImportProgress(100);
      toast({
        title: 'تم الاستيراد',
        description: 'تم استيراد البيانات بنجاح',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'فشل الاستيراد',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    let csv = '';
    if (entityType === 'terms') {
      csv = 'code,label_ar,label_en,parent_code,sort_order,active,attrs\n';
      csv += 'TERM001,مصطلح تجريبي,Test Term,,0,true,{}\n';
    } else if (entityType === 'mappings') {
      csv = 'source_system,src_code,target_code,term_id,notes\n';
      csv += 'SAP,EMP001,EMPLOYEE001,,مثال على الربط\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${entityType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>استيراد متقدم - {entityType === 'terms' ? 'المصطلحات' : 'الربط'}</DialogTitle>
          <DialogDescription>
            قم بتحميل ملف CSV أو Excel لاستيراد البيانات بشكل جماعي
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!catalogId && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>يرجى اختيار كتالوج أولاً</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="file-upload">اختر ملف CSV</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                disabled={!catalogId || isImporting}
              />
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="mt-6">
              <FileText className="h-4 w-4 ml-2" />
              تحميل قالب
            </Button>
          </div>

          {isValidating && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              جاري التحقق من البيانات...
            </div>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                تم العثور على {validationErrors.length} خطأ في البيانات
                <ul className="mt-2 list-disc list-inside">
                  {validationErrors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>
                      الصف {err.row}: {err.field} - {err.message}
                    </li>
                  ))}
                  {validationErrors.length > 5 && <li>...و {validationErrors.length - 5} أخطاء أخرى</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {previewData.length > 0 && validationErrors.length === 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>البيانات صالحة! معاينة أول 10 صفوف:</AlertDescription>
            </Alert>
          )}

          {previewData.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(previewData[0])
                      .filter(k => k !== '_rowNumber')
                      .map(key => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.entries(row)
                        .filter(([k]) => k !== '_rowNumber')
                        .map(([key, value]) => (
                          <TableCell key={key}>{String(value)}</TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>جاري الاستيراد...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          )}

          {importResult && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                تم الاستيراد بنجاح:{' '}
                {importResult.inserted && `${importResult.inserted} سجل جديد`}
                {importResult.updated && `, ${importResult.updated} سجل محدث`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              !file ||
              !catalogId ||
              validationErrors.length > 0 ||
              isValidating ||
              isImporting ||
              previewData.length === 0
            }
          >
            <Upload className="h-4 w-4 ml-2" />
            استيراد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
