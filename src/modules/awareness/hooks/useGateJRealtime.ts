// Gate-J D1: Real-time Subscriptions Hook
// Real-time updates for impact scores using Supabase subscriptions

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to subscribe to real-time impact score updates
 */
export function useGateJRealtime(tenantId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tenantId) return;

    // Subscribe to impact scores changes
    const scoresChannel = supabase
      .channel('gate-j-impact-scores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'awareness_impact_scores',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('Impact score change:', payload);

          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['gate-j-impact-scores'] });

          // Show notification based on event type
          if (payload.eventType === 'INSERT') {
            toast('تم إضافة نقطة تأثير جديدة');
          } else if (payload.eventType === 'UPDATE') {
            toast('تم تحديث نقطة تأثير');
          } else if (payload.eventType === 'DELETE') {
            toast('تم حذف نقطة تأثير');
          }
        }
      )
      .subscribe();

    // Subscribe to bulk operations changes
    const bulkOpsChannel = supabase
      .channel('gate-j-bulk-operations-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gate_j_bulk_operations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('Bulk operation change:', payload);

          const newRecord = payload.new as any;
          
          // Only notify when operation completes
          if (newRecord.status === 'completed' || newRecord.status === 'partial' || newRecord.status === 'failed') {
            queryClient.invalidateQueries({ queryKey: ['gate-j-impact-scores'] });

            if (newRecord.status === 'completed') {
              toast(`اكتملت العملية الجماعية: ${newRecord.operation_type}`, {
                description: `تم التأثير على ${newRecord.affected_count} سجل`,
              });
            } else if (newRecord.status === 'partial') {
              toast(`اكتملت العملية الجماعية جزئياً`, {
                description: `تم التأثير على ${newRecord.affected_count} من أصل ${newRecord.impact_score_ids?.length || 0} سجل`,
              });
            } else {
              toast('فشلت العملية الجماعية', {
                description: 'لم يتم التأثير على أي سجلات',
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(scoresChannel);
      supabase.removeChannel(bulkOpsChannel);
    };
  }, [tenantId, queryClient]);
}
