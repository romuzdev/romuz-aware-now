/**
 * Bulk Remediation Dialog Component
 * Bulk remediation operations for multiple gaps
 */

import { useState } from 'react';
import { Zap, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Label } from '@/core/components/ui/label';
import { Progress } from '@/core/components/ui/progress';
import { useBulkRemediateGaps } from '@/modules/grc';
import type { AutomatedComplianceGap } from '@/modules/grc/integration/compliance-automation.integration';

interface BulkRemediationDialogProps {
  selectedGaps: AutomatedComplianceGap[];
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BulkRemediationDialog({
  selectedGaps,
  open,
  onClose,
  onSuccess,
}: BulkRemediationDialogProps) {
  const [remediationType, setRemediationType] = useState<'auto_map' | 'create_controls' | 'assign_owners'>('auto_map');
  const [result, setResult] = useState<any>(null);

  const bulkRemediate = useBulkRemediateGaps();

  const handleRemediate = async () => {
    const res = await bulkRemediate.mutateAsync({
      gaps: selectedGaps,
      remediationType,
    });
    setResult(res);
  };

  const handleClose = () => {
    setResult(null);
    onClose();
    if (result?.success_count > 0) {
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            المعالجة الجماعية
          </DialogTitle>
          <DialogDescription>
            معالجة {selectedGaps.length} فجوة دفعة واحدة
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-6">
            {/* Selected Gaps Summary */}
            <div className="space-y-3">
              <Label>الفجوات المحددة ({selectedGaps.length})</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 p-3 border rounded-lg">
                {selectedGaps.map((gap) => (
                  <div key={gap.gap_id} className="flex items-center justify-between text-sm">
                    <span>{gap.requirement_code}</span>
                    <Badge variant="outline" className="text-xs">
                      {gap.gap_severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Remediation Type Selection */}
            <div className="space-y-3">
              <Label>نوع المعالجة</Label>
              <RadioGroup value={remediationType} onValueChange={(v) => setRemediationType(v as any)}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2 space-x-reverse p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="auto_map" id="auto_map" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="auto_map" className="cursor-pointer font-medium">
                        ربط تلقائي بالضوابط
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        البحث التلقائي عن الضوابط المناسبة وربطها بالمتطلبات (معدل تطابق &gt; 50%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 space-x-reverse p-3 border rounded-lg cursor-pointer hover:bg-muted/50 opacity-50">
                    <RadioGroupItem value="create_controls" id="create_controls" disabled className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="create_controls" className="cursor-pointer font-medium">
                        إنشاء ضوابط جديدة
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        إنشاء ضوابط جديدة للمتطلبات التي ليس لها ضوابط مناسبة (قريباً)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 space-x-reverse p-3 border rounded-lg cursor-pointer hover:bg-muted/50 opacity-50">
                    <RadioGroupItem value="assign_owners" id="assign_owners" disabled className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="assign_owners" className="cursor-pointer font-medium">
                        تعيين مسؤولين
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        تعيين مسؤولين تلقائياً بناءً على الأدوار والصلاحيات (قريباً)
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                إلغاء
              </Button>
              <Button
                onClick={handleRemediate}
                disabled={bulkRemediate.isPending}
              >
                <Zap className="ml-2 h-4 w-4" />
                {bulkRemediate.isPending ? 'جاري المعالجة...' : 'بدء المعالجة'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Result Summary */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-green-50 border-green-200">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {result.success_count}
                  </div>
                  <p className="text-sm text-muted-foreground">نجحت</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg bg-red-50 border-red-200">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {result.failed_count}
                  </div>
                  <p className="text-sm text-muted-foreground">فشلت</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">التقدم</span>
                <span className="font-medium">
                  {result.success_count} / {selectedGaps.length}
                </span>
              </div>
              <Progress 
                value={(result.success_count / selectedGaps.length) * 100} 
                className="h-2"
              />
            </div>

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-red-600">الأخطاء ({result.errors.length})</Label>
                <div className="max-h-40 overflow-y-auto space-y-1 p-3 border border-red-200 rounded-lg bg-red-50/50">
                  {result.errors.map((error: string, index: number) => (
                    <div key={index} className="text-sm text-red-700">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={handleClose}>
                <CheckCircle className="ml-2 h-4 w-4" />
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
