/**
 * Document OCR Component
 * M10: Smart Documents Enhancement
 * Extract text from images and PDFs using Lovable AI
 */

import { useState } from 'react';
import { FileText, Upload, Loader2, AlertCircle, CheckCircle2, Copy, Download } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Textarea } from '@/core/components/ui/textarea';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { usePerformOCR, useOCRSupport } from '../hooks/useDocumentOCR';
import { toast } from 'sonner';

interface DocumentOCRProps {
  documentId: string;
  storagePath: string;
  mimeType: string;
  onTextExtracted?: (text: string) => void;
}

export function DocumentOCR({
  documentId,
  storagePath,
  mimeType,
  onTextExtracted,
}: DocumentOCRProps) {
  const [extractedText, setExtractedText] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  
  const ocrMutation = usePerformOCR();
  const isSupported = useOCRSupport(mimeType);

  const handleExtractText = async () => {
    setShowResult(false);
    
    try {
      const result = await ocrMutation.mutateAsync({
        document_id: documentId,
        storage_path: storagePath,
        mime_type: mimeType,
      });

      setExtractedText(result.text);
      setShowResult(true);
      
      if (onTextExtracted) {
        onTextExtracted(result.text);
      }
    } catch (error) {
      console.error('OCR Error:', error);
    }
  };

  const handleCopyText = async () => {
    if (!extractedText) return;
    
    try {
      await navigator.clipboard.writeText(extractedText);
      toast.success('تم نسخ النص إلى الحافظة');
    } catch (error) {
      toast.error('فشل نسخ النص');
    }
  };

  const handleDownloadText = () => {
    if (!extractedText) return;
    
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted-text-${documentId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('تم تحميل النص');
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  const getCharacterCount = (text: string) => {
    return text.length;
  };

  if (!isSupported) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">نوع الملف غير مدعوم</p>
            <p className="text-sm">
              استخراج النص متاح فقط للصور (JPG, PNG, WEBP) وملفات PDF
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">استخراج النص (OCR)</h3>
            <p className="text-sm text-muted-foreground">
              استخدام الذكاء الاصطناعي لاستخراج النص من المستند
            </p>
          </div>
        </div>
        
        <Badge variant="outline" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Lovable AI
        </Badge>
      </div>

      {/* Extract Button */}
      {!showResult && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="rounded-full bg-primary/10 p-6">
            <Upload className="h-12 w-12 text-primary" />
          </div>
          
          <div className="text-center">
            <h4 className="font-semibold mb-2">جاهز لاستخراج النص</h4>
            <p className="text-sm text-muted-foreground max-w-md">
              انقر على الزر أدناه لبدء عملية استخراج النص من المستند باستخدام تقنية OCR المتقدمة
            </p>
          </div>

          <Button
            onClick={handleExtractText}
            disabled={ocrMutation.isPending}
            size="lg"
            className="gap-2"
          >
            {ocrMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الاستخراج...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                استخراج النص
              </>
            )}
          </Button>

          {ocrMutation.isPending && (
            <div className="w-full max-w-md">
              <Progress value={undefined} className="h-2" />
              <p className="text-xs text-center text-muted-foreground mt-2">
                قد تستغرق هذه العملية بضع ثوانٍ...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {showResult && extractedText && (
        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">عدد الكلمات</p>
              <p className="text-2xl font-bold">{getWordCount(extractedText)}</p>
            </Card>
            
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">عدد الأحرف</p>
              <p className="text-2xl font-bold">{getCharacterCount(extractedText)}</p>
            </Card>
            
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">الحالة</p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-600">مكتمل</span>
              </div>
            </Card>
          </div>

          {/* Extracted Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">النص المستخرج</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyText}
                  className="gap-2"
                >
                  <Copy className="h-3 w-3" />
                  نسخ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadText}
                  className="gap-2"
                >
                  <Download className="h-3 w-3" />
                  تحميل
                </Button>
              </div>
            </div>
            
            <Textarea
              value={extractedText}
              readOnly
              className="min-h-[300px] font-mono text-sm"
              dir="auto"
            />
          </div>

          {/* Re-extract Button */}
          <Button
            onClick={handleExtractText}
            variant="outline"
            disabled={ocrMutation.isPending}
            className="w-full gap-2"
          >
            {ocrMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري إعادة الاستخراج...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                إعادة استخراج النص
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error State */}
      {showResult && !extractedText && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          
          <div className="text-center">
            <h4 className="font-semibold mb-2">لم يتم العثور على نص</h4>
            <p className="text-sm text-muted-foreground max-w-md">
              لم نتمكن من استخراج أي نص من هذا المستند. تأكد من أن المستند يحتوي على نص قابل للقراءة.
            </p>
          </div>

          <Button
            onClick={handleExtractText}
            variant="outline"
            disabled={ocrMutation.isPending}
          >
            حاول مرة أخرى
          </Button>
        </div>
      )}
    </Card>
  );
}
