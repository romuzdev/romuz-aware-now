/**
 * Committees Import/Export Hook
 * Gate-K: D4 Upgrade - D1 Standard
 * 
 * Handles import/export operations for committees
 */

import { useImportExport } from '@/core/hooks/utils/useImportExport';
import { fetchCommittees, createCommittee } from '@/modules/committees/integration';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for importing and exporting committees
 * 
 * Features:
 * - Export to CSV/JSON/XLSX
 * - Import from CSV/JSON
 * - Column mapping for imports
 * - Validation before import
 * - Progress tracking
 */
export function useCommitteesImportExport() {
  const queryClient = useQueryClient();
  const importExport = useImportExport('committees');

  /**
   * Export committees to file
   */
  const exportCommittees = async (
    format: 'csv' | 'json' | 'xlsx',
    filters?: any
  ) => {
    // Fetch committees based on filters
    const fetchData = async () => {
      const committees = await fetchCommittees();
      
      // Apply filters if provided
      let filteredData = committees;
      if (filters?.status && filters.status !== 'all') {
        filteredData = filteredData.filter(c => c.status === filters.status);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filteredData = filteredData.filter(c =>
          c.code.toLowerCase().includes(search) ||
          c.name.toLowerCase().includes(search) ||
          c.name_ar?.toLowerCase().includes(search)
        );
      }

      // Select specific columns for export
      return filteredData.map(committee => ({
        code: committee.code,
        name: committee.name,
        name_ar: committee.name_ar,
        status: committee.status,
        committee_type: committee.committee_type,
        description: committee.description,
        charter_url: committee.charter_url,
        created_at: committee.created_at,
        updated_at: committee.updated_at,
      }));
    };

    return await importExport.doExport(
      {
        entity_type: 'committee',
        file_format: format,
        columns: [
          'code',
          'name',
          'name_ar',
          'status',
          'committee_type',
          'description',
          'charter_url',
          'created_at',
          'updated_at',
        ],
        metadata: { filters },
      },
      fetchData
    );
  };

  /**
   * Import committees from file
   */
  const importCommittees = async (
    file: File,
    format: 'csv' | 'json' | 'xlsx',
    options?: {
      mapping?: Record<string, string>;
      validate?: boolean;
    }
  ) => {
    // Import function that creates committees
    const importData = async (data: any[]) => {
      // Validate required fields
      const requiredFields = ['code', 'name'];
      const errors: any[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Check required fields
        const missingFields = requiredFields.filter(field => !row[field]);
        if (missingFields.length > 0) {
          errors.push({
            row: i + 1,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            data: row,
          });
          continue;
        }

        // Create committee
        try {
          await createCommittee({
            code: row.code,
            name: row.name,
            name_ar: row.name_ar || null,
            status: row.status || 'active',
            committee_type: row.committee_type || 'standing',
            description: row.description || null,
            charter_url: row.charter_url || null,
          });
        } catch (error: any) {
          errors.push({
            row: i + 1,
            error: error.message,
            data: row,
          });
        }
      }

      if (errors.length > 0) {
        console.error('Import errors:', errors);
        throw new Error(`Failed to import ${errors.length} row(s). Check console for details.`);
      }

      // Refresh committees list
      queryClient.invalidateQueries({ queryKey: ['committees'] });
    };

    return await importExport.doImport(
      {
        entity_type: 'committee',
        file_format: format,
        file,
        mapping: options?.mapping,
        validate: options?.validate ?? true,
      },
      importData
    );
  };

  return {
    exportCommittees,
    importCommittees,
    isExporting: importExport.isExporting,
    isImporting: importExport.isImporting,
    history: importExport.history,
  };
}
