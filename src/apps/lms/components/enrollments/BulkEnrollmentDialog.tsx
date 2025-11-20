/**
 * LMS - Bulk Enrollment Dialog Component
 * Allows enrolling multiple users in a course via CSV upload or manual selection
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { bulkEnroll } from '@/modules/training/integration/enrollments.integration';
import type { BulkEnrollmentInput } from '@/modules/training/types/enrollment.types';

interface BulkEnrollmentDialogProps {
  open: boolean;
  onClose: () => void;
  courseId?: string;
  onSuccess?: () => void;
}

interface CSVRow {
  user_id: string;
  due_date?: string;
}

interface ParsedData {
  rows: CSVRow[];
  errors: string[];
}

export default function BulkEnrollmentDialog({
  open,
  onClose,
  courseId: initialCourseId,
  onSuccess,
}: BulkEnrollmentDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [courseId, setCourseId] = useState(initialCourseId || '');
  const [enrollmentType, setEnrollmentType] = useState<'self' | 'assigned' | 'mandatory'>('assigned');
  const [dueDate, setDueDate] = useState('');
  const [preview, setPreview] = useState<ParsedData | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ total: number; success: number; failed: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'خطأ في الملف',
        description: 'يرجى اختيار ملف CSV',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: 'ملف فارغ',
          description: 'الملف لا يحتوي على بيانات',
          variant: 'destructive',
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const userIdIndex = headers.findIndex(h => h === 'user_id');
      const dueDateIndex = headers.findIndex(h => h === 'due_date');

      if (userIdIndex === -1) {
        toast({
          title: 'خطأ في التنسيق',
          description: 'الملف يجب أن يحتوي على عمود user_id',
          variant: 'destructive',
        });
        return;
      }

      const rows: CSVRow[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const userId = values[userIdIndex];

        if (!userId) {
          errors.push(`السطر ${i + 1}: user_id مفقود`);
          continue;
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
          errors.push(`السطر ${i + 1}: user_id غير صحيح`);
          continue;
        }

        const row: CSVRow = { user_id: userId };
        
        if (dueDateIndex !== -1 && values[dueDateIndex]) {
          row.due_date = values[dueDateIndex];
        }

        rows.push(row);
      }

      setPreview({ rows, errors });

      if (rows.length === 0) {
        toast({
          title: 'لا توجد بيانات صالحة',
          description: 'جميع الصفوف تحتوي على أخطاء',
          variant: 'destructive',
        });
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview || preview.rows.length === 0) {
      toast({
        title: 'لا توجد بيانات',
        description: 'يرجى رفع ملف CSV صالح',
        variant: 'destructive',
      });
      return;
    }

    if (!courseId) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى اختيار الدورة',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      const input: BulkEnrollmentInput = {
        course_id: courseId,
        user_ids: preview.rows.map(r => r.user_id),
        enrollment_type: enrollmentType,
        due_date: dueDate || undefined,
      };

      const result = await bulkEnroll(input);

      setResult(result);

      if (result.failed === 0) {
        toast({
          title: 'تم التسجيل بنجاح',
          description: `تم تسجيل ${result.success} مستخدم في الدورة`,
        });
        
        if (onSuccess) onSuccess();
        
        // Reset after 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        toast({
          title: 'تم التسجيل جزئياً',
          description: `نجح: ${result.success} | فشل: ${result.failed}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Bulk enrollment error:', error);
      toast({
        title: 'خطأ في التسجيل',
        description: 'حدث خطأ أثناء تسجيل المستخدمين',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setCourseId(initialCourseId || '');
    setEnrollmentType('assigned');
    setDueDate('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            تسجيل جماعي
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course">الدورة *</Label>
            <Input
              id="course"
              placeholder="Course ID"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={!!initialCourseId}
            />
            <p className="text-xs text-muted-foreground">
              أدخل معرف الدورة (UUID)
            </p>
          </div>

          {/* Enrollment Type */}
          <div className="space-y-2">
            <Label htmlFor="enrollment-type">نوع التسجيل</Label>
            <Select value={enrollmentType} onValueChange={(v: any) => setEnrollmentType(v)}>
              <SelectTrigger id="enrollment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mandatory">إلزامي</SelectItem>
                <SelectItem value="assigned">مُعيّن</SelectItem>
                <SelectItem value="self">تسجيل ذاتي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due-date">تاريخ الاستحقاق (اختياري)</Label>
            <Input
              id="due-date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* CSV Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">ملف CSV</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              التنسيق المطلوب: user_id, due_date (اختياري)
            </p>
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <Label>معاينة البيانات</Label>
              <div className="border rounded-md p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {preview.rows.length} صف صالح
                  </span>
                </div>
                
                {preview.errors.length > 0 && (
                  <div className="flex items-start gap-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive mb-1">
                        {preview.errors.length} خطأ:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {preview.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx} className="text-muted-foreground">{err}</li>
                        ))}
                        {preview.errors.length > 5 && (
                          <li className="text-muted-foreground">
                            و {preview.errors.length - 5} أخطاء أخرى...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <Label>النتيجة</Label>
              <div className="border rounded-md p-4 bg-muted/50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{result.total}</p>
                    <p className="text-xs text-muted-foreground">الإجمالي</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{result.success}</p>
                    <p className="text-xs text-muted-foreground">نجح</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">{result.failed}</p>
                    <p className="text-xs text-muted-foreground">فشل</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            إلغاء
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!preview || preview.rows.length === 0 || importing || !courseId}
          >
            {importing ? 'جاري التسجيل...' : `تسجيل ${preview?.rows.length || 0} مستخدم`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
