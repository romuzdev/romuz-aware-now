/**
 * Documents Import/Export Hook
 * Gate-D3: Documents Module - D1 Standard
 * 
 * React hook for importing and exporting documents data
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useImportExport } from '@/core/hooks/utils/useImportExport';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { createDocument } from '@/modules/documents/integration/documents-data';
import type { Document } from '@/modules/documents';

export function useDocumentsImportExport() {
  const { toast } = useToast();
  const { tenantId } = useAppContext();
  const importExport = useImportExport('documents');

  /**
   * Export documents to CSV or JSON
   */
  const exportDocuments = useCallback(
    async (documents: Document[], format: 'csv' | 'json') => {
      if (!tenantId) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'لم يتم العثور على معرف المستأجر',
        });
        return;
      }

      try {
        await importExport.doExport(
          {
            entity_type: 'document',
            file_format: format,
            filters: {
              total_count: documents.length,
            },
            metadata: {
              exported_at: new Date().toISOString(),
            },
          },
          async () => documents
        );
      } catch (error: any) {
        console.error('Export error:', error);
      }
    },
    [tenantId, importExport, toast]
  );

  /**
   * Import documents from CSV or JSON file
   */
  const importDocuments = useCallback(
    async (file: File) => {
      if (!tenantId) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'لم يتم العثور على معرف المستأجر',
        });
        return;
      }

      try {
        const fileContent = await file.text();
        let documents: any[] = [];

        if (file.name.endsWith('.json')) {
          documents = JSON.parse(fileContent);
        } else if (file.name.endsWith('.csv')) {
          documents = parseCSV(fileContent);
        } else {
          throw new Error('نوع الملف غير مدعوم. استخدم CSV أو JSON فقط');
        }

        await importExport.doImport(
          {
            entity_type: 'document',
            file_format: file.name.endsWith('.json') ? 'json' : 'csv',
            file: file,
            validate: true,
            metadata: {
              file_name: file.name,
              file_size_bytes: file.size,
            },
          },
          async (data) => {
            // Validate and create documents
            await Promise.all(
              data.map(async (docData: any) => {
                // Validate required fields
                if (!docData.title || !docData.doc_type) {
                  throw new Error(
                    `مستند غير صالح: العنوان والنوع مطلوبان`
                  );
                }

                // Create document
                await createDocument(tenantId, {
                  title: docData.title,
                  description: docData.description || null,
                  doc_type: docData.doc_type,
                  status: docData.status || 'draft',
                  linked_module: docData.linked_module || null,
                  linked_entity_id: docData.linked_entity_id || null,
                });
              })
            );
          }
        );
      } catch (error: any) {
        console.error('Import error:', error);
        toast({
          variant: 'destructive',
          title: 'فشل الاستيراد',
          description: error.message,
        });
      }
    },
    [tenantId, importExport, toast]
  );

  return {
    exportDocuments,
    importDocuments,
    isExporting: importExport.isExporting,
    isImporting: importExport.isImporting,
    history: importExport.history,
  };
}

/**
 * Parse CSV content into array of objects
 */
function parseCSV(content: string): any[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });
    data.push(row);
  }

  return data;
}
