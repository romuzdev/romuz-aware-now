import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Campaign } from '../types/campaign.types';
import { supabase } from '@/integrations/supabase/client';
import { qk } from '@/lib/query/keys';
import type { CampaignFilters } from './useCampaignsFilters';

export type CampaignsQuery = {
  page?: number;
  filters: CampaignFilters;
};

async function fetchCampaigns(params: CampaignsQuery) {
  const { page = 1, filters } = params;
  const { q, status, from, to, owner, includeArchived, pageSize, sortBy, sortDir } = filters;

  let query = supabase
    .from('awareness_campaigns')
    .select('id, name, description, status, start_date, end_date, owner_name, created_at, updated_at, archived_at, archived_by', { count: 'exact' });

  // Apply filters
  if (!includeArchived) {
    query = query.is('archived_at', null);
  }

  if (q?.trim()) {
    query = query.ilike('name', `%${q.trim()}%`);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (owner?.trim()) {
    query = query.ilike('owner_name', `%${owner.trim()}%`);
  }

  if (from) {
    query = query.gte('start_date', from);
  }

  if (to) {
    query = query.lte('end_date', to);
  }

  // Sorting
  const ascending = sortDir === 'asc';
  query = query.order(sortBy, { ascending });

  // Pagination
  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;

  const { data, error, count } = await query.range(fromIdx, toIdx);
  if (error) throw new Error(error.message);

  const mapped: Campaign[] = (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    status: r.status,
    startDate: r.start_date ?? undefined,
    endDate: r.end_date ?? undefined,
    ownerName: r.owner_name ?? undefined,
    createdAt: r.created_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
    archivedAt: r.archived_at ?? undefined,
    archivedBy: r.archived_by ?? undefined,
  }));
  return { data: mapped, total: count ?? mapped.length };
}

export function useCampaignsList(params: CampaignsQuery) {
  const query = useQuery({
    queryKey: qk.campaigns.list(params),
    queryFn: () => fetchCampaigns(params),
    staleTime: 60 * 1000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000,
  });

  const stats = useMemo(() => {
    const d = query.data?.data ?? [];
    return {
      total: query.data?.total ?? 0,
      active: d.filter(c => c.status === 'active').length,
      scheduled: d.filter(c => c.status === 'scheduled').length,
      completed: d.filter(c => c.status === 'completed').length,
    };
  }, [query.data]);

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    stats,
  };
}
