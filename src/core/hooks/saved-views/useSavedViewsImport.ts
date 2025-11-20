import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

type UseSavedViewsImportParams = {
  pageKey: string;  // e.g., 'campaigns:list'
};

/**
 * useSavedViewsImport - One-time migration helper
 * 
 * Imports localStorage saved views into the server table on first load.
 * After successful import, clears the localStorage key to prevent duplicate imports.
 * 
 * Usage:
 *   const { imported, importing, runImport } = useSavedViewsImport({ pageKey: 'campaigns:list' });
 *   
 *   // Auto-run import on mount (if no server views exist)
 *   useEffect(() => {
 *     if (!imported && !importing) {
 *       runImport();
 *     }
 *   }, []);
 */
export function useSavedViewsImport({ pageKey }: UseSavedViewsImportParams) {
  const { tenantId, user } = useAppContext();
  const { toast } = useToast();
  const [imported, setImported] = useState(false);
  const [importing, setImporting] = useState(false);

  // localStorage key from the old MVP implementation
  const getLocalStorageKey = (): string | null => {
    if (!tenantId || !user?.id) return null;
    const tid = tenantId || 'no-tenant';
    const uid = user.id || 'anon';
    
    // Match the old format: cz:views:campaigns:{tenantId}:{userId}
    if (pageKey === 'campaigns:list') {
      return `cz:views:campaigns:${tid}:${uid}`;
    }
    
    // For other pages, use generic format
    return `cz:views:${pageKey}:${tid}:${uid}`;
  };

  const runImport = async () => {
    if (!tenantId || !user?.id) {
      logger.debug('useSavedViewsImport: Missing tenant or user context, skipping import');
      return;
    }

    setImporting(true);

    try {
      // Step 1: Check if server already has views for this page
      const { data: existing, error: checkError } = await supabase
        .from('saved_views')
        .select('id')
        .eq('page_key', pageKey)
        .limit(1);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        logger.debug('useSavedViewsImport: Server views already exist, skipping import');
        setImported(true);
        setImporting(false);
        return;
      }

      // Step 2: Read localStorage views
      const localKey = getLocalStorageKey();
      if (!localKey) {
        setImported(true);
        setImporting(false);
        return;
      }

      const rawLocal = localStorage.getItem(localKey);
      if (!rawLocal) {
        logger.debug('useSavedViewsImport: No localStorage views found');
        setImported(true);
        setImporting(false);
        return;
      }

      let localViews: any[] = [];
      try {
        localViews = JSON.parse(rawLocal);
      } catch (e) {
        logger.error('useSavedViewsImport: Failed to parse localStorage views', e);
        setImported(true);
        setImporting(false);
        return;
      }

      if (!Array.isArray(localViews) || localViews.length === 0) {
        logger.debug('useSavedViewsImport: No valid localStorage views to import');
        setImported(true);
        setImporting(false);
        return;
      }

      // Step 3: Import views into server table
      const viewsToInsert = localViews.map((v: any) => ({
        tenant_id: tenantId,
        user_id: user.id,
        page_key: pageKey,
        name: v.name || 'Untitled View',
        filters: v.filters || {},
        is_default: false,
      }));

      const { error: insertError } = await supabase
        .from('saved_views')
        .insert(viewsToInsert);

      if (insertError) throw insertError;

      // Step 4: Clear localStorage key
      localStorage.removeItem(localKey);

      logger.info(`useSavedViewsImport: Successfully imported ${viewsToInsert.length} view(s)`);
      toast({ 
        title: 'Views imported', 
        description: `${viewsToInsert.length} saved view(s) have been imported from local storage.` 
      });

      setImported(true);
    } catch (error: any) {
      logger.error('useSavedViewsImport: Import failed', error);
      toast({
        variant: 'destructive', 
        title: 'Import failed', 
        description: error.message 
      });
    } finally {
      setImporting(false);
    }
  };

  // Auto-run import on mount (if context is ready)
  useEffect(() => {
    if (tenantId && user?.id && !imported && !importing) {
      runImport();
    }
  }, [tenantId, user?.id]);

  return {
    imported,
    importing,
    runImport,
  };
}
