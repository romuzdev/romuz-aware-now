/**
 * Bulk Operations Dialog Component
 * Gate-K: Core Infrastructure - D1 Standard
 * 
 * Reusable component for bulk operations
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export type BulkOperationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  selectedCount: number;
  operationType: 'delete' | 'update' | 'archive' | 'export';
  isExecuting: boolean;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  } | null;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmVariant?: 'default' | 'destructive';
};

export function BulkOperationsDialog({
  open,
  onOpenChange,
  title,
  description,
  selectedCount,
  operationType,
  isExecuting,
  progress,
  onConfirm,
  confirmLabel,
  confirmVariant = 'default',
}: BulkOperationDialogProps) {
  const getOperationLabel = () => {
    switch (operationType) {
      case 'delete':
        return 'حذف';
      case 'update':
        return 'تحديث';
      case 'archive':
        return 'أرشفة';
      case 'export':
        return 'تصدير';
      default:
        return 'تنفيذ';
    }
  };

  const getOperationIcon = () => {
    if (progress?.percentage === 100) {
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    }
    if (isExecuting) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return <AlertCircle className="h-5 w-5 text-warning" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getOperationIcon()}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              سيتم {getOperationLabel()} <strong>{selectedCount}</strong> عنصر
            </AlertDescription>
          </Alert>

          {isExecuting && progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">التقدم:</span>
                <span className="font-medium">
                  {progress.current} / {progress.total} ({progress.percentage}%)
                </span>
              </div>
              <Progress value={progress.percentage} />
            </div>
          )}

          {operationType === 'delete' && !isExecuting && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                تحذير: لا يمكن التراجع عن هذا الإجراء. سيتم حذف العناصر بشكل نهائي.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExecuting}
          >
            إلغاء
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isExecuting}
          >
            {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel || getOperationLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
