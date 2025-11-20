import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AuditItem = {
  id: string;
  action: string;
  actor: string | null;
  createdAt: string;
  payload?: any;
};

async function fetchAudit(campaignId?: string): Promise<AuditItem[]> {
  if (!campaignId) return [];
  const { data, error } = await supabase
    .from('audit_log')
    .select('id, entity_type, entity_id, action, actor, created_at, payload')
    .eq('entity_type', 'campaign')
    .eq('entity_id', campaignId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    action: r.action,
    actor: r.actor ?? null,
    createdAt: r.created_at,
    payload: r.payload,
  }));
}

export function useCampaignAuditLog(id?: string) {
  const q = useQuery({
    queryKey: ['audit', 'campaign', id],
    queryFn: () => fetchAudit(id),
    enabled: !!id,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
  });
  return { data: q.data ?? [], isLoading: q.isLoading, error: q.error ? String(q.error) : null, refetch: q.refetch };
}
