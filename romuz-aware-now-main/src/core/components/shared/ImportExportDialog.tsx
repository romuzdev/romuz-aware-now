/**
 * Import/Export Dialog Component
 * Gate-K: Core Infrastructure - D1 Standard
 * 
 * Reusable component for import/export operations
 */

import React, { useState, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Download, Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';

export type ImportExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  onExport: (format: 'csv' | 'json' | 'xlsx') => Promise<void>;
  onImport: (file: File, format: 'csv' | 'json' | 'xlsx') => Promise<void>;
  isExporting?: boolean;
  isImporting?: boolean;
};

export function ImportExportDialog({
  open,
  onOpenChange,
  entityType,
  onExport,
  onImport,
  isExporting = false,
  isImporting = false,
}: ImportExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
  const [importFormat, setImportFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    await onExport(exportFormat);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    await onImport(selectedFile, importFormat);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-detect format from file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv' || extension === 'json' || extension === 'xlsx') {
        setImportFormat(extension);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>استيراد / تصدير البيانات</DialogTitle>
          <DialogDescription>
            استيراد أو تصدير بيانات {entityType}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="mr-2 h-4 w-4" />
              تصدير
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="mr-2 h-4 w-4" />
              استيراد
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                سيتم تصدير جميع البيانات المطابقة للفلاتر الحالية
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="export-format">تنسيق التصدير</Label>
              <Select
                value={exportFormat}
                onValueChange={(v: any) => setExportFormat(v)}
              >
                <SelectTrigger id="export-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Download className="mr-2 h-4 w-4" />
                تصدير
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                تأكد من أن الملف يحتوي على الأعمدة الصحيحة وأن البيانات منسقة بشكل صحيح
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="import-format">تنسيق الملف</Label>
                <Select
                  value={importFormat}
                  onValueChange={(v: any) => setImportFormat(v)}
                >
                  <SelectTrigger id="import-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">اختر الملف</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept={`.${importFormat},application/${importFormat === 'json' ? 'json' : importFormat === 'xlsx' ? 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'csv'}`}
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    الملف المحدد: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || isImporting}
              >
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload className="mr-2 h-4 w-4" />
                استيراد
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
