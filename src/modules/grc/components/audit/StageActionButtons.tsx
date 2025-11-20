/**
 * Stage Action Buttons Component
 * M12: Action buttons for workflow stage management
 */

import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { 
  PlayCircle, 
  CheckCircle2, 
  Pause, 
  SkipForward, 
  MoreHorizontal,
  UserPlus,
  MessageSquare,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';

export interface StageActionButtonsProps {
  stageStatus: 'pending' | 'in_progress' | 'completed' | 'blocked';
  canStart?: boolean;
  canComplete?: boolean;
  canPause?: boolean;
  canSkip?: boolean;
  canAssign?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onPause?: () => void;
  onSkip?: () => void;
  onAssign?: () => void;
  onAddNote?: () => void;
  onReschedule?: () => void;
  isLoading?: boolean;
}

export function StageActionButtons({
  stageStatus,
  canStart = true,
  canComplete = true,
  canPause = true,
  canSkip = false,
  canAssign = true,
  onStart,
  onComplete,
  onPause,
  onSkip,
  onAssign,
  onAddNote,
  onReschedule,
  isLoading = false,
}: StageActionButtonsProps) {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  const handleComplete = () => {
    setShowCompleteDialog(true);
  };

  const handleSkip = () => {
    setShowSkipDialog(true);
  };

  const confirmComplete = () => {
    onComplete?.();
    setShowCompleteDialog(false);
  };

  const confirmSkip = () => {
    onSkip?.();
    setShowSkipDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Primary Actions */}
        {stageStatus === 'pending' && onStart && canStart && (
          <Button 
            onClick={onStart} 
            disabled={isLoading}
            className="gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            بدء المرحلة
          </Button>
        )}

        {stageStatus === 'in_progress' && (
          <>
            {onComplete && canComplete && (
              <Button 
                onClick={handleComplete} 
                disabled={isLoading}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                إكمال المرحلة
              </Button>
            )}

            {onPause && canPause && (
              <Button 
                onClick={onPause} 
                variant="outline"
                disabled={isLoading}
                className="gap-2"
              >
                <Pause className="w-4 h-4" />
                إيقاف مؤقت
              </Button>
            )}
          </>
        )}

        {stageStatus === 'blocked' && (
          <Button 
            variant="destructive"
            disabled={isLoading}
            className="gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            حل المشكلة
          </Button>
        )}

        {/* Secondary Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={isLoading}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>إجراءات إضافية</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {onAssign && canAssign && (
              <DropdownMenuItem onClick={onAssign}>
                <UserPlus className="w-4 h-4 ml-2" />
                تعيين مسؤول
              </DropdownMenuItem>
            )}

            {onAddNote && (
              <DropdownMenuItem onClick={onAddNote}>
                <MessageSquare className="w-4 h-4 ml-2" />
                إضافة ملاحظة
              </DropdownMenuItem>
            )}

            {onReschedule && (
              <DropdownMenuItem onClick={onReschedule}>
                <Calendar className="w-4 h-4 ml-2" />
                إعادة جدولة
              </DropdownMenuItem>
            )}

            {onSkip && canSkip && stageStatus !== 'completed' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSkip}
                  className="text-yellow-600"
                >
                  <SkipForward className="w-4 h-4 ml-2" />
                  تخطي المرحلة
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Complete Confirmation Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إكمال المرحلة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إكمال هذه المرحلة؟ سيتم الانتقال تلقائياً إلى المرحلة التالية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmComplete}>
              تأكيد الإكمال
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تخطي المرحلة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تخطي هذه المرحلة؟ قد يؤثر هذا على سير العمل.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSkip} className="bg-yellow-600">
              تأكيد التخطي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
