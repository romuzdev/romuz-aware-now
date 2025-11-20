/**
 * Document OCR React Query Hooks
 * M10: Smart Documents Enhancement
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  performOCR,
  performBatchOCR,
  supportsOCR,
  validateOCRRequest,
  type OCRRequest,
} from '../integration/ocr.integration';

/**
 * Perform OCR on a single document
 */
export function usePerformOCR() {
  return useMutation({
    mutationFn: (request: OCRRequest) => {
      const validation = validateOCRRequest(request);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      return performOCR(request);
    },
    onSuccess: (data) => {
      if (data.text) {
        toast.success('تم استخراج النص بنجاح');
      } else {
        toast.warning('لم يتم العثور على نص في المستند');
      }
    },
    onError: (error: Error) => {
      toast.error(`فشل استخراج النص: ${error.message}`);
    },
  });
}

/**
 * Perform batch OCR on multiple documents
 */
export function useBatchOCR() {
  return useMutation({
    mutationFn: (requests: OCRRequest[]) => {
      // Validate all requests
      const invalidRequests = requests.filter(req => {
        const validation = validateOCRRequest(req);
        return !validation.valid;
      });

      if (invalidRequests.length > 0) {
        throw new Error(`${invalidRequests.length} مستند غير صالح للمعالجة`);
      }

      return performBatchOCR(requests);
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.text && r.text.length > 0).length;
      toast.success(`تم معالجة ${successCount} من ${results.length} مستند بنجاح`);
    },
    onError: (error: Error) => {
      toast.error(`فشلت المعالجة الجماعية: ${error.message}`);
    },
  });
}

/**
 * Helper hook to check if OCR is supported
 */
export function useOCRSupport(mimeType: string | undefined) {
  if (!mimeType) return false;
  return supportsOCR(mimeType);
}
