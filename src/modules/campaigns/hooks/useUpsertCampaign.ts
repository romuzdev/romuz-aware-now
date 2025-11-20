import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantUser } from '@/lib/app/get-tenant-user';
import type { CampaignCreateInput, CampaignUpdateInput } from '@/schemas/campaigns';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/lib/audit/log-event';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';

export function useCreateCampaign() {
  const { tenantId, userId } = useTenantUser();
  const { toast } = useToast();
  const { logCampaign } = useAuditLog();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [id, setId] = useState<string| null>(null);

  async function create(input: CampaignCreateInput) {
    setLoading(true); setError(null);
    if (!tenantId || !userId) {
      const msg = 'Missing tenant/user context';
      setError(msg); setLoading(false);
      toast({ variant: 'destructive', title: 'Failed to create', description: msg });
      return null;
    }

    const { data, error } = await supabase
      .from('awareness_campaigns')
      .insert({
        tenant_id: tenantId,
        name: input.name,
        description: input.description ?? null,
        status: input.status,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        owner_name: input.ownerName ?? null,
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      toast({ variant: 'destructive', title: 'Failed to create', description: error.message });
      return null;
    }
    const newId = data?.id ?? null;
    setId(newId);
    setLoading(false);
    toast({ title: 'Campaign created', description: 'Your campaign has been created successfully.' });
    
    // Log to audit
    if (newId) {
      logCampaign('campaign.created', newId, {
        name: input.name,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
      });
      
      // Invalidate queries
      await qc.invalidateQueries({ queryKey: ['campaigns', 'list'] });
      await qc.invalidateQueries({ queryKey: qk.campaigns.byId(newId) });
    }
    
    return newId;
  }

  return { create, loading, error, id };
}

export function useUpdateCampaign() {
  const { tenantId } = useTenantUser();
  const { toast } = useToast();
  const { logCampaign } = useAuditLog();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function update(input: CampaignUpdateInput) {
    setLoading(true); setError(null);

    let q = supabase
      .from('awareness_campaigns')
      .update({
        name: input.name,
        description: input.description ?? null,
        status: input.status,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        owner_name: input.ownerName ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id);

    if (tenantId) q = q.eq('tenant_id', tenantId);

    const { error } = await q;

    if (error) {
      setError(error.message);
      setLoading(false);
      toast({ variant: 'destructive', title: 'Failed to save', description: error.message });
      return false;
    }
    setLoading(false);
    toast({ title: 'Changes saved', description: 'Campaign has been updated.' });
    
    // Log to audit
    logCampaign('campaign.updated', input.id, {
      name: input.name,
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
    });
    
    // Invalidate queries
    await qc.invalidateQueries({ queryKey: ['campaigns', 'list'] });
    await qc.invalidateQueries({ queryKey: qk.campaigns.byId(input.id) });
    
    return true;
  }

  return { update, loading, error };
}
