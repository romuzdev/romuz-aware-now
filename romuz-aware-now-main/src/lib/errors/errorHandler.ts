/**
 * Unified Error Handling
 * Gate-K: D1 Standard - Phase 6 Unification
 * 
 * Centralized error handling utilities for consistent error management
 */

import { toast } from '@/hooks/use-toast';

/**
 * Standard error types
 */
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTH = 'auth',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  DUPLICATE = 'duplicate',
  UNKNOWN = 'unknown',
}

/**
 * Application Error class
 */
export class AppError extends Error {
  type: ErrorType;
  details?: any;

  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, details?: any) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
  }
}

/**
 * Parse Supabase error into AppError
 */
export function parseSupabaseError(error: any): AppError {
  const message = error?.message || 'حدث خطأ غير متوقع';

  // Duplicate key violation
  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return new AppError('هذا السجل موجود بالفعل', ErrorType.DUPLICATE, error);
  }

  // Foreign key violation
  if (message.includes('foreign key')) {
    return new AppError('لا يمكن تنفيذ هذا الإجراء - توجد بيانات مرتبطة', ErrorType.VALIDATION, error);
  }

  // Permission denied
  if (message.includes('permission') || message.includes('policy')) {
    return new AppError('ليس لديك صلاحية لهذا الإجراء', ErrorType.PERMISSION, error);
  }

  // Not found
  if (message.includes('not found') || message.includes('no rows')) {
    return new AppError('السجل المطلوب غير موجود', ErrorType.NOT_FOUND, error);
  }

  // Network/connection errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return new AppError('خطأ في الاتصال - تحقق من الإنترنت', ErrorType.NETWORK, error);
  }

  // Auth errors
  if (message.includes('auth') || message.includes('token') || message.includes('session')) {
    return new AppError('خطأ في المصادقة - يرجى تسجيل الدخول مجددًا', ErrorType.AUTH, error);
  }

  return new AppError(message, ErrorType.UNKNOWN, error);
}

/**
 * Handle error with toast notification
 */
export function handleError(error: unknown, context?: string): AppError {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = parseSupabaseError(error);
  } else if (typeof error === 'string') {
    appError = new AppError(error);
  } else {
    appError = new AppError('حدث خطأ غير متوقع');
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[Error Handler]', context || 'Unknown context', {
      type: appError.type,
      message: appError.message,
      details: appError.details,
    });
  }

  return appError;
}

/**
 * Show error toast with consistent styling
 */
export function showErrorToast(error: unknown, context?: string) {
  const appError = handleError(error, context);

  toast({
    variant: 'destructive',
    title: context ? `خطأ: ${context}` : 'خطأ',
    description: appError.message,
  });

  return appError;
}

/**
 * Handle async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (err) {
    const error = showErrorToast(err, context);
    return { data: null, error };
  }
}

/**
 * Retry failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    onRetry?: (attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, onRetry } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        onRetry?.(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}
