import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';

export function useRealtimeCampaign(campaignId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`campaign_${campaignId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'awareness_campaigns', filter: `id=eq.${campaignId}` },
        async () => {
          await qc.invalidateQueries({ queryKey: qk.campaigns.byId(campaignId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, qc]);
}
