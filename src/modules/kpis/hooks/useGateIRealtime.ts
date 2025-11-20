// Gate-I D1: Real-time Subscriptions Hook
// Real-time updates for KPI catalog using Supabase subscriptions

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to subscribe to real-time KPI catalog updates
 */
export function useGateIRealtime(tenantId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tenantId) return;

    // Subscribe to kpi_catalog changes
    const kpiChannel = supabase
      .channel('gate-i-kpi-catalog-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kpi_catalog',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('KPI catalog change:', payload);

          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['gate-i-kpis'] });

          // Show notification based on event type
          if (payload.eventType === 'INSERT') {
            toast('تم إضافة مؤشر جديد');
          } else if (payload.eventType === 'UPDATE') {
            toast('تم تحديث مؤشر');
          } else if (payload.eventType === 'DELETE') {
            toast('تم حذف مؤشر');
          }
        }
      )
      .subscribe();

    // Subscribe to bulk operations changes
    const bulkOpsChannel = supabase
      .channel('gate-i-bulk-operations-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gate_i_bulk_operations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('Bulk operation change:', payload);

          const newRecord = payload.new as any;
          
          // Only notify when operation completes
          if (newRecord.status === 'completed' || newRecord.status === 'partial' || newRecord.status === 'failed') {
            queryClient.invalidateQueries({ queryKey: ['gate-i-kpis'] });

            if (newRecord.status === 'completed') {
              toast(`اكتملت العملية الجماعية: ${newRecord.operation_type}`, {
                description: `تم التأثير على ${newRecord.affected_count} مؤشر`,
              });
            } else if (newRecord.status === 'partial') {
              toast(`اكتملت العملية الجماعية جزئياً`, {
                description: `تم التأثير على ${newRecord.affected_count} من أصل ${newRecord.kpi_ids?.length || 0} مؤشر`,
              });
            } else {
              toast('فشلت العملية الجماعية', {
                description: 'لم يتم التأثير على أي مؤشرات',
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(kpiChannel);
      supabase.removeChannel(bulkOpsChannel);
    };
  }, [tenantId, queryClient]);
}
