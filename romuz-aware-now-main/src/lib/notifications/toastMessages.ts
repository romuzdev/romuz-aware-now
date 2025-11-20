/**
 * Unified Toast Notifications
 * Gate-K: D1 Standard - Phase 6 Unification
 * 
 * Centralized toast notification messages (AR/EN support)
 */

import { toast } from '@/hooks/use-toast';

/**
 * Standard toast types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast message templates
 */
export const ToastMessages = {
  // Success messages
  success: {
    created: (entity: string) => ({
      title: 'تم الإنشاء بنجاح',
      description: `تم إنشاء ${entity} بنجاح`,
    }),
    updated: (entity: string) => ({
      title: 'تم التحديث بنجاح',
      description: `تم تحديث ${entity} بنجاح`,
    }),
    deleted: (entity: string) => ({
      title: 'تم الحذف بنجاح',
      description: `تم حذف ${entity} بنجاح`,
    }),
    archived: (entity: string, count?: number) => ({
      title: 'تم الأرشفة',
      description: count ? `تم أرشفة ${count} ${entity}` : `تم أرشفة ${entity} بنجاح`,
    }),
    unarchived: (entity: string, count?: number) => ({
      title: 'تم الاستعادة',
      description: count ? `تم استعادة ${count} ${entity}` : `تم استعادة ${entity} بنجاح`,
    }),
    duplicated: (entity: string, count?: number) => ({
      title: 'تم النسخ',
      description: count ? `تم نسخ ${count} ${entity}` : `تم نسخ ${entity} بنجاح`,
    }),
    exported: (entity: string, count: number) => ({
      title: 'تم التصدير',
      description: `تم تصدير ${count} ${entity}`,
    }),
    imported: (entity: string, count: number) => ({
      title: 'تم الاستيراد',
      description: `تم استيراد ${count} ${entity}`,
    }),
    saved: (entity: string) => ({
      title: 'تم الحفظ',
      description: `تم حفظ ${entity} بنجاح`,
    }),
  },

  // Error messages
  error: {
    loadFailed: (entity: string) => ({
      title: 'فشل التحميل',
      description: `فشل تحميل ${entity}`,
    }),
    createFailed: (entity: string) => ({
      title: 'فشل الإنشاء',
      description: `فشل إنشاء ${entity}`,
    }),
    updateFailed: (entity: string) => ({
      title: 'فشل التحديث',
      description: `فشل تحديث ${entity}`,
    }),
    deleteFailed: (entity: string) => ({
      title: 'فشل الحذف',
      description: `فشل حذف ${entity}`,
    }),
    exportFailed: (entity: string) => ({
      title: 'فشل التصدير',
      description: `فشل تصدير ${entity}`,
    }),
    importFailed: (entity: string) => ({
      title: 'فشل الاستيراد',
      description: `فشل استيراد ${entity}`,
    }),
    noPermission: () => ({
      title: 'لا توجد صلاحية',
      description: 'ليس لديك صلاحية لهذا الإجراء',
    }),
    networkError: () => ({
      title: 'خطأ في الاتصال',
      description: 'تحقق من اتصال الإنترنت',
    }),
    validation: (field?: string) => ({
      title: 'خطأ في التحقق',
      description: field ? `يرجى التحقق من ${field}` : 'يرجى التحقق من البيانات المدخلة',
    }),
  },

  // Warning messages
  warning: {
    unsavedChanges: () => ({
      title: 'تحذير',
      description: 'لديك تغييرات غير محفوظة',
    }),
    confirmDelete: (entity: string) => ({
      title: 'تأكيد الحذف',
      description: `هل أنت متأكد من حذف ${entity}؟`,
    }),
    confirmArchive: (entity: string, count?: number) => ({
      title: 'تأكيد الأرشفة',
      description: count
        ? `هل أنت متأكد من أرشفة ${count} ${entity}؟`
        : `هل أنت متأكد من أرشفة ${entity}؟`,
    }),
  },

  // Info messages
  info: {
    loading: (entity: string) => ({
      title: 'جاري التحميل',
      description: `جاري تحميل ${entity}...`,
    }),
    processing: (action: string) => ({
      title: 'جاري المعالجة',
      description: `جاري ${action}...`,
    }),
    noData: (entity: string) => ({
      title: 'لا توجد بيانات',
      description: `لا توجد ${entity} لعرضها`,
    }),
  },
};

/**
 * Show success toast
 */
export function showSuccess(
  key: keyof typeof ToastMessages.success,
  entity: string,
  count?: number
) {
  const message = (ToastMessages.success[key] as any)(entity, count);
  toast({
    title: message.title,
    description: message.description,
  });
}

/**
 * Show error toast
 */
export function showError(
  key: keyof typeof ToastMessages.error,
  entity?: string,
  details?: string
) {
  const message = (ToastMessages.error[key] as any)(entity);
  toast({
    variant: 'destructive',
    title: message.title,
    description: details || message.description,
  });
}

/**
 * Show warning toast
 */
export function showWarning(
  key: keyof typeof ToastMessages.warning,
  entity: string,
  count?: number
) {
  const message = (ToastMessages.warning[key] as any)(entity, count);
  toast({
    title: message.title,
    description: message.description,
  });
}

/**
 * Show info toast
 */
export function showInfo(key: keyof typeof ToastMessages.info, param: string) {
  const message = (ToastMessages.info[key] as any)(param);
  toast({
    title: message.title,
    description: message.description,
  });
}

/**
 * Show custom toast
 */
export function showCustom(title: string, description: string, variant?: 'default' | 'destructive') {
  toast({
    variant: variant || 'default',
    title,
    description,
  });
}
