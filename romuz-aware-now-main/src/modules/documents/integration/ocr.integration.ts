/**
 * Document OCR Integration
 * M10: Smart Documents Enhancement - OCR via Lovable AI
 */

import { supabase } from '@/integrations/supabase/client';

export interface OCRResult {
  text: string;
  confidence?: number;
  language?: string;
  page_count?: number;
}

export interface OCRRequest {
  document_id: string;
  storage_path: string;
  mime_type: string;
}

/**
 * Perform OCR on a document using Lovable AI
 * 
 * @param request - OCR request with document details
 * @returns Extracted text from the document
 */
export async function performOCR(request: OCRRequest): Promise<OCRResult> {
  try {
    const { data, error } = await supabase.functions.invoke('document-ocr', {
      body: {
        documentId: request.document_id,
        storagePath: request.storage_path,
        mimeType: request.mime_type,
      },
    });

    if (error) {
      console.error('OCR Error:', error);
      throw new Error(`OCR failed: ${error.message}`);
    }

    return data as OCRResult;
  } catch (err) {
    console.error('OCR Integration Error:', err);
    throw err;
  }
}

/**
 * Batch OCR processing for multiple documents
 */
export async function performBatchOCR(requests: OCRRequest[]): Promise<OCRResult[]> {
  const results = await Promise.allSettled(
    requests.map(req => performOCR(req))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`OCR failed for document ${requests[index].document_id}:`, result.reason);
      return {
        text: '',
        confidence: 0,
        language: 'unknown',
      };
    }
  });
}

/**
 * Check if a document type supports OCR
 */
export function supportsOCR(mimeType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'application/pdf',
  ];

  return supportedTypes.includes(mimeType.toLowerCase());
}

/**
 * Validate OCR request
 */
export function validateOCRRequest(request: OCRRequest): { valid: boolean; error?: string } {
  if (!request.document_id) {
    return { valid: false, error: 'Document ID is required' };
  }

  if (!request.storage_path) {
    return { valid: false, error: 'Storage path is required' };
  }

  if (!supportsOCR(request.mime_type)) {
    return { 
      valid: false, 
      error: `Unsupported file type: ${request.mime_type}. Supported types: images and PDF.`
    };
  }

  return { valid: true };
}
