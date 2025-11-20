import { useQuery } from '@tanstack/react-query';
import type { Campaign } from '../types/campaign.types';
import { supabase } from '@/integrations/supabase/client';
import { qk } from '@/lib/query/keys';

async function fetchCampaignById(id?: string): Promise<Campaign | null> {
  if (!id) return null;
  const { data, error } = await supabase
    .from('awareness_campaigns')
    .select('id, name, description, status, start_date, end_date, owner_name, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? undefined,
    status: data.status,
    startDate: data.start_date ?? undefined,
    endDate: data.end_date ?? undefined,
    ownerName: data.owner_name ?? undefined,
    createdAt: data.created_at ?? undefined,
    updatedAt: data.updated_at ?? undefined,
  };
}

export function useCampaignById(id?: string) {
  const query = useQuery({
    queryKey: qk.campaigns.byId(id),
    queryFn: () => fetchCampaignById(id),
    enabled: !!id,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
