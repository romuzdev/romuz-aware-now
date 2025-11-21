import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogFilters {
  entityType?: string;
  action?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string;
  created_at: string;
  payload: any;
  tenant_id: string;
}

async function fetchAuditLog(filters: AuditLogFilters = {}): Promise<{
  data: AuditLogEntry[];
  count: number;
}> {
  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.actorId) {
    query = query.eq('actor', filters.actorId);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    data: data || [],
    count: count || 0,
  };
}

export function useAuditLog(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ['audit-log', filters],
    queryFn: () => fetchAuditLog(filters),
    staleTime: 30 * 1000,
  });
}
