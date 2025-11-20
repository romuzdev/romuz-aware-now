/**
 * Documents Hook
 * Gate-D3: Documents Module - D1 Standard
 * 
 * React hook for fetching documents with caching and real-time updates
 */

import { useEffect, useState } from 'react';
import type { Document } from '../types';
import { 
  fetchDocumentsForTenant, 
  logDocumentReadAction 
} from '@/modules/documents/integration/documents-data';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const documentsCache = new Map<string, Document[]>();

export function useDocuments(filters?: any) {
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
        // ✅ Check cache first
        if (documentsCache.has(tenantId)) {
          setData(documentsCache.get(tenantId)!);
          setLoading(false);
          return;
        }

        const documents = await fetchDocumentsForTenant(tenantId);
        setData(documents);
        documentsCache.set(tenantId, documents);

        // ✅ Log audit read (bulk view)
        await logDocumentReadAction('*', tenantId);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();

    // ✅ Set up real-time subscription
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          console.log('📡 Real-time update received:', payload);

          // Show toast notification based on event type
          const document = payload.new as Document | null;
          const oldDocument = payload.old as Document | null;

          switch (payload.eventType) {
            case 'INSERT':
              if (document) {
                toast.success(`مستند جديد: ${document.title}`, {
                  description: `تم إضافة المستند ${document.doc_type}`,
                  duration: 4000,
                });
              }
              break;
            case 'UPDATE':
              if (document) {
                toast.info(`تم تحديث المستند: ${document.title}`, {
                  description: `المستند ${document.doc_type} تم تحديثه`,
                  duration: 4000,
                });
              }
              break;
            case 'DELETE':
              if (oldDocument) {
                toast.warning(`تم حذف المستند: ${oldDocument.title}`, {
                  description: `المستند ${oldDocument.doc_type} تم حذفه`,
                  duration: 4000,
                });
              }
              break;
          }

          // Refetch documents to get the latest data
          try {
            const updatedDocuments = await fetchDocumentsForTenant(tenantId);
            setData(updatedDocuments);
            documentsCache.set(tenantId, updatedDocuments);
          } catch (err: any) {
            console.error('Failed to refetch documents:', err.message);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  const refetch = () => {
    if (tenantId) {
      documentsCache.delete(tenantId);
      setLoading(true);
      fetchDocumentsForTenant(tenantId)
        .then((documents) => {
          setData(documents);
          documentsCache.set(tenantId, documents);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  };

  return { 
    data,
    documents: data,
    total: data.length,
    loading,
    error: error || '', 
    refetch 
  };
}
