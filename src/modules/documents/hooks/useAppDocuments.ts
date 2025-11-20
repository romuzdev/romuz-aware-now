/**
 * useAppDocuments Hook
 * Gate-D3: Documents Module - Multi-App Repository
 * 
 * React hook for fetching documents filtered by app_code
 */

import { useEffect, useState } from 'react';
import type { Document } from '../types';
import { fetchDocumentsByApp } from '../integration/documents-data';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAppDocumentsOptions {
  appCode: string;
  enableRealtime?: boolean;
}

export function useAppDocuments({ appCode, enableRealtime = true }: UseAppDocumentsOptions) {
  const [data, setData] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantId } = useAppContext();

  useEffect(() => {
    if (!tenantId) {
      setError('Tenant not found.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const documents = await fetchDocumentsByApp(tenantId, appCode);
        setData(documents);
      } catch (err: any) {
        setError(err.message);
        toast.error('فشل تحميل المستندات', {
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    }

    load();

    // Real-time subscription (optional)
    if (!enableRealtime) return;

    const channel = supabase
      .channel(`documents-${appCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          const document = (payload.new || payload.old) as Document | null;
          
          // Only handle events for this app's documents
          if (document && document.app_code !== appCode) {
            return;
          }

          console.log(`📡 Real-time update for ${appCode}:`, payload);

          // Show toast notification
          switch (payload.eventType) {
            case 'INSERT':
              if (document) {
                toast.success(`مستند جديد: ${document.title}`);
              }
              break;
            case 'UPDATE':
              if (document) {
                toast.info(`تم تحديث المستند: ${document.title}`);
              }
              break;
            case 'DELETE':
              if (document) {
                toast.warning(`تم حذف المستند: ${document.title}`);
              }
              break;
          }

          // Refetch documents
          try {
            const updatedDocuments = await fetchDocumentsByApp(tenantId, appCode);
            setData(updatedDocuments);
          } catch (err: any) {
            console.error('Failed to refetch documents:', err.message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, appCode, enableRealtime]);

  const refetch = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const documents = await fetchDocumentsByApp(tenantId, appCode);
      setData(documents);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error('فشل تحديث المستندات', {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    documents: data,
    total: data.length,
    loading,
    error: error || '',
    refetch,
  };
}
