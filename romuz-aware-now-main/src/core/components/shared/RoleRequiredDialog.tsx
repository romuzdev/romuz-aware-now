/**
 * Role Required Dialog
 * 
 * Replaces AdminPasswordDialog with role-based authorization dialog
 * Shows informative message about missing role requirements
 * 
 * SECURITY: Part of the fix for hardcoded password vulnerability
 * Date: 2025-11-17
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { Shield } from 'lucide-react';
import type { AppRole } from '@/core/rbac/types';

interface RoleRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredRole: AppRole;
  title?: string;
  description?: string;
}

/**
 * Dialog shown when user lacks required role for an action
 */
export function RoleRequiredDialog({
  open,
  onOpenChange,
  requiredRole,
  title = 'غير مصرح',
  description,
}: RoleRequiredDialogProps) {
  const defaultDescription = `هذا الإجراء يتطلب دور: ${requiredRole}. الرجاء الاتصال بمدير النظام إذا كنت تعتقد أنه يجب أن يكون لديك هذه الصلاحية.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            فهمت
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
