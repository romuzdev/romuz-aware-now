/**
 * Policies Import/Export Hook
 * Gate-D2: Policies Module - D1 Standard
 * 
 * React hook for importing and exporting policies data
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useImportExport } from '@/core/hooks/utils/useImportExport';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { createPolicy } from '@/modules/policies/integration';
import type { Policy } from '@/modules/policies';

export function usePoliciesImportExport() {
  const { toast } = useToast();
  const { tenantId } = useAppContext();
  const importExport = useImportExport('policies');

  /**
   * Export policies to CSV or JSON
   */
  const exportPolicies = useCallback(
    async (policies: Policy[], format: 'csv' | 'json') => {
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
            entity_type: 'policy',
            file_format: format,
            filters: {
              total_count: policies.length,
            },
            metadata: {
              exported_at: new Date().toISOString(),
            },
          },
          async () => policies
        );
      } catch (error: any) {
        console.error('Export error:', error);
      }
    },
    [tenantId, importExport, toast]
  );

  /**
   * Import policies from CSV or JSON file
   */
  const importPolicies = useCallback(
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
        let policies: any[] = [];

        if (file.name.endsWith('.json')) {
          policies = JSON.parse(fileContent);
        } else if (file.name.endsWith('.csv')) {
          policies = parseCSV(fileContent);
        } else {
          throw new Error('نوع الملف غير مدعوم. استخدم CSV أو JSON فقط');
        }

        await importExport.doImport(
          {
            entity_type: 'policy',
            file_format: file.name.endsWith('.json') ? 'json' : 'csv',
            file: file,
            validate: true,
            metadata: {
              file_name: file.name,
              file_size_bytes: file.size,
            },
          },
          async (data) => {
            // Validate and create policies
            await Promise.all(
              data.map(async (policyData: any) => {
                // Validate required fields
                if (!policyData.code || !policyData.title) {
                  throw new Error(
                    `سياسة غير صالحة: الكود والعنوان مطلوبان`
                  );
                }

                // Create policy
                await createPolicy(tenantId, {
                  code: policyData.code,
                  title: policyData.title,
                  owner: policyData.owner || null,
                  status: policyData.status || 'draft',
                  category: policyData.category || null,
                  last_review_date: policyData.last_review_date || null,
                  next_review_date: policyData.next_review_date || null,
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
    exportPolicies,
    importPolicies,
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
