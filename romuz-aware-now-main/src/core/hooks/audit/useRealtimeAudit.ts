import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';

export function useRealtimeAudit(campaignId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`audit_campaign_${campaignId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log', filter: `entity_id=eq.${campaignId}` },
        async () => {
          await qc.invalidateQueries({ queryKey: qk.audit.byCampaign(campaignId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, qc]);
}
