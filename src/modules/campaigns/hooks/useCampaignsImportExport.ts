/**
 * Campaigns Import/Export Hook
 * Gate-K: D1 Standard - M2 Campaigns Module
 * 
 * Provides import/export functionality for campaigns with progress tracking
 */

import { useImportExport } from '@/core/hooks/utils/useImportExport';
import { supabase } from '@/integrations/supabase/client';
import { useTenantUser } from '@/lib/app/get-tenant-user';
import type { Campaign } from '../types/campaign.types';

/**
 * Hook for importing/exporting campaigns
 * Integrates with core import/export service
 */
export function useCampaignsImportExport() {
  const { tenantId, userId } = useTenantUser();
  const importExport = useImportExport('campaigns');

  /**
   * Export campaigns to CSV/JSON
   */
  const exportCampaigns = async (
    campaigns: Campaign[],
    format: 'csv' | 'json' = 'csv'
  ) => {
    return importExport.doExport(
      {
        entity_type: 'campaign',
        file_format: format,
        filters: {},
      },
      async () => {
        // Transform campaigns to export format
        return campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          status: c.status,
          start_date: c.startDate || '',
          end_date: c.endDate || '',
          owner_name: c.ownerName || '',
          created_at: c.createdAt || '',
          updated_at: c.updatedAt || '',
        }));
      }
    );
  };

  /**
   * Import campaigns from CSV/JSON
   */
  const importCampaigns = async (
    file: File,
    options: {
      mode: 'create' | 'update' | 'upsert';
      skipDuplicates?: boolean;
    } = { mode: 'create' }
  ) => {
    return importExport.doImport(
      {
        entity_type: 'campaign',
        file_format: file.name.endsWith('.json') ? 'json' : 'csv',
        file,
        metadata: {
          import_mode: options.mode,
          skip_duplicates: options.skipDuplicates || false,
        },
      },
      async (rows: any[]) => {
        const validRows = rows.filter((r) => r.name?.trim());

        if (validRows.length === 0) {
          throw new Error('لا توجد صفوف صالحة للاستيراد');
        }

        // Prepare campaigns for insert
        const campaigns = validRows.map((r) => ({
          tenant_id: tenantId!,
          name: r.name.trim(),
          description: r.description || null,
          status: r.status || 'draft',
          start_date: r.start_date || null,
          end_date: r.end_date || null,
          owner_name: r.owner_name || null,
          created_by: userId!,
        }));

        // Handle mode
        if (options.mode === 'create') {
          // Insert new campaigns
          const { error } = await supabase
            .from('awareness_campaigns')
            .insert(campaigns);
          if (error) throw new Error(error.message);
        } else if (options.mode === 'update') {
          // Update existing campaigns
          for (const c of campaigns) {
            const { error } = await supabase
              .from('awareness_campaigns')
              .update(c)
              .eq('name', c.name)
              .eq('tenant_id', tenantId!);
            if (error) throw new Error(error.message);
          }
        } else {
          // Upsert (insert or update)
          const { error } = await supabase
            .from('awareness_campaigns')
            .upsert(campaigns, {
              onConflict: 'tenant_id,name',
              ignoreDuplicates: options.skipDuplicates,
            });
          if (error) throw new Error(error.message);
        }
      }
    );
  };

  return {
    exportCampaigns,
    importCampaigns,
    isExporting: importExport.isExporting,
    isImporting: importExport.isImporting,
    history: importExport.history,
    refetchHistory: importExport.refetchHistory,
  };
}
