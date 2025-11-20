import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenantUser } from '@/lib/app/get-tenant-user';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import type { CampaignStatus } from '../types/campaign.types';
import { useAuditLog } from '@/lib/audit/log-event';

const CHUNK = 200;

function chunk<T>(arr: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function useBulkCampaignActions() {
  const { toast } = useToast();
  const { tenantId, userId } = useTenantUser();
  const qc = useQueryClient();
  const { logCampaign } = useAuditLog();

  async function invalidateAll() {
    await qc.invalidateQueries({ queryKey: ['campaigns'] });
  }

  async function bulkUpdate(ids: string[], patch: Record<string, any>, logAction?: (id: string) => void) {
    if (!ids?.length) return 0;
    let done = 0;
    for (const part of chunk(ids)) {
      const { error } = await supabase.from('awareness_campaigns').update(patch).in('id', part);
      if (error) throw new Error(error.message);
      done += part.length;
      if (logAction) part.forEach(id => logAction(id));
    }
    return done;
  }

  async function archive(ids: string[]) {
    const n = await bulkUpdate(ids, { archived_at: new Date().toISOString(), archived_by: userId ?? null }, (id) =>
      logCampaign('campaign.archived' as any, id, null)
    );
    toast({ title: 'Archived', description: `Archived ${n} campaign(s).` });
    await invalidateAll();
  }

  async function unarchive(ids: string[]) {
    const n = await bulkUpdate(ids, { archived_at: null, archived_by: null }, (id) =>
      logCampaign('campaign.unarchived' as any, id, null)
    );
    toast({ title: 'Unarchived', description: `Restored ${n} campaign(s).` });
    await invalidateAll();
  }

  async function changeStatus(ids: string[], status: CampaignStatus) {
    const n = await bulkUpdate(ids, { status, updated_at: new Date().toISOString() }, (id) =>
      logCampaign('campaign.status_changed' as any, id, { status })
    );
    toast({ title: 'Status updated', description: `Changed status for ${n} campaign(s).` });
    await invalidateAll();
  }

  async function setOwner(ids: string[], ownerName: string) {
    const n = await bulkUpdate(ids, { owner_name: ownerName, updated_at: new Date().toISOString() }, (id) =>
      logCampaign('campaign.owner_changed' as any, id, { ownerName })
    );
    toast({ title: 'Owner updated', description: `Set owner for ${n} campaign(s).` });
    await invalidateAll();
  }

  async function duplicateOne(id: string): Promise<string | null> {
    const { data: src, error: e1 } = await supabase
      .from('awareness_campaigns')
      .select('id, name, description, start_date, end_date, owner_name')
      .eq('id', id).maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!src) return null;

    const { data, error: e2 } = await supabase
      .from('awareness_campaigns')
      .insert({
        tenant_id: tenantId!,
        name: `${src.name} (Copy)`,
        description: src.description ?? null,
        status: 'draft',
        start_date: src.start_date ?? null,
        end_date: src.end_date ?? null,
        owner_name: src.owner_name ?? null,
        archived_at: null,
        archived_by: null,
        created_by: userId!,
      })
      .select('id').single();
    if (e2) throw new Error(e2.message);

    const newId = data?.id ?? null;
    toast({ title: 'Duplicated', description: `Created a copy of "${src.name}".` });
    if (newId) logCampaign('campaign.duplicated' as any, newId, { sourceId: id });
    await invalidateAll();
    return newId;
  }

  async function duplicateMany(ids: string[]): Promise<number> {
    if (!ids?.length) return 0;
    const { data: rows, error: e1 } = await supabase
      .from('awareness_campaigns')
      .select('id, name, description, start_date, end_date, owner_name')
      .in('id', ids);
    if (e1) throw new Error(e1.message);
    if (!rows?.length) return 0;

    let inserted = 0;
    for (const part of chunk(rows)) {
      const payload = part.map((r: any) => ({
        tenant_id: tenantId!,
        name: `${r.name} (Copy)`,
        description: r.description ?? null,
        status: 'draft',
        start_date: r.start_date ?? null,
        end_date: r.end_date ?? null,
        owner_name: r.owner_name ?? null,
        archived_at: null,
        archived_by: null,
        created_by: userId!,
      }));
      const { error } = await supabase.from('awareness_campaigns').insert(payload);
      if (error) throw new Error(error.message);
      inserted += payload.length;
    }

    toast({ title: 'Duplicated', description: `Created ${inserted} copy(ies).` });
    ids.forEach(id => logCampaign('campaign.duplicated' as any, id, { mode: 'bulk' }));
    await invalidateAll();
    return inserted;
  }

  async function hardDelete(_ids: string[]) {
    // intentionally disabled in UI
  }

  return { archive, unarchive, changeStatus, setOwner, duplicateOne, duplicateMany, hardDelete };
}
