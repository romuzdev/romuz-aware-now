import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAuditRealtime(campaignId?: string, onInsert?: () => void) {
  useEffect(() => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`audit-log-campaign-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_log',
          filter: `entity_type=eq.campaign,entity_id=eq.${campaignId}`,
        },
        (_payload) => {
          // Trigger refresh when a new audit row for this campaign arrives
          onInsert?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, onInsert]);
}
