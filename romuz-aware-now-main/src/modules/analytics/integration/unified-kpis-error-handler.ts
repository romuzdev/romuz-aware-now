/**
 * M14 - Unified Error Handler for KPI Dashboard
 * Centralized error handling with logging and user-friendly messages
 */

import { toast } from 'sonner';

export interface KPIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * Error codes for KPI operations
 */
export const KPI_ERROR_CODES = {
  FETCH_FAILED: 'KPI_FETCH_FAILED',
  SNAPSHOT_FAILED: 'KPI_SNAPSHOT_FAILED',
  ALERT_DETECTION_FAILED: 'KPI_ALERT_DETECTION_FAILED',
  ACKNOWLEDGE_FAILED: 'KPI_ACKNOWLEDGE_FAILED',
  UNAUTHORIZED: 'KPI_UNAUTHORIZED',
  INVALID_INPUT: 'KPI_INVALID_INPUT',
  NETWORK_ERROR: 'KPI_NETWORK_ERROR',
  UNKNOWN: 'KPI_UNKNOWN_ERROR'
} as const;

/**
 * User-friendly error messages in Arabic
 */
const ERROR_MESSAGES: Record<string, string> = {
  [KPI_ERROR_CODES.FETCH_FAILED]: 'فشل تحميل بيانات المؤشرات',
  [KPI_ERROR_CODES.SNAPSHOT_FAILED]: 'فشل حفظ اللقطة',
  [KPI_ERROR_CODES.ALERT_DETECTION_FAILED]: 'فشل اكتشاف التنبيهات',
  [KPI_ERROR_CODES.ACKNOWLEDGE_FAILED]: 'فشل اعتماد التنبيه',
  [KPI_ERROR_CODES.UNAUTHORIZED]: 'غير مصرح لك بهذا الإجراء',
  [KPI_ERROR_CODES.INVALID_INPUT]: 'البيانات المدخلة غير صحيحة',
  [KPI_ERROR_CODES.NETWORK_ERROR]: 'خطأ في الاتصال بالشبكة',
  [KPI_ERROR_CODES.UNKNOWN]: 'حدث خطأ غير متوقع'
};

/**
 * Parse error and return KPIError object
 */
export function parseKPIError(error: any): KPIError {
  // Supabase PostgrestError
  if (error?.code) {
    return {
      code: determineErrorCode(error),
      message: ERROR_MESSAGES[determineErrorCode(error)] || error.message,
      details: error.details || error.hint,
      timestamp: new Date()
    };
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: KPI_ERROR_CODES.NETWORK_ERROR,
      message: ERROR_MESSAGES[KPI_ERROR_CODES.NETWORK_ERROR],
      details: error.message,
      timestamp: new Date()
    };
  }

  // Generic error
  return {
    code: KPI_ERROR_CODES.UNKNOWN,
    message: ERROR_MESSAGES[KPI_ERROR_CODES.UNKNOWN],
    details: error?.message || String(error),
    timestamp: new Date()
  };
}

/**
 * Determine error code from Supabase error
 */
function determineErrorCode(error: any): string {
  // RLS policy violation
  if (error.code === '42501' || error.message?.includes('policy')) {
    return KPI_ERROR_CODES.UNAUTHORIZED;
  }

  // Invalid input
  if (error.code === '23505' || error.code === '23503') {
    return KPI_ERROR_CODES.INVALID_INPUT;
  }

  return KPI_ERROR_CODES.UNKNOWN;
}

/**
 * Handle error with toast notification and console logging
 */
export function handleKPIError(error: any, showToast: boolean = true): KPIError {
  const kpiError = parseKPIError(error);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[KPI Error]', {
      code: kpiError.code,
      message: kpiError.message,
      details: kpiError.details,
      timestamp: kpiError.timestamp,
      originalError: error
    });
  }

  // Show toast notification
  if (showToast) {
    toast.error(kpiError.message, {
      description: process.env.NODE_ENV === 'development' ? kpiError.details : undefined
    });
  }

  return kpiError;
}

/**
 * Wrap async function with error handling
 */
export function withKPIErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorCode: string = KPI_ERROR_CODES.UNKNOWN
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const kpiError = handleKPIError(error);
      throw kpiError;
    }
  }) as T;
}
