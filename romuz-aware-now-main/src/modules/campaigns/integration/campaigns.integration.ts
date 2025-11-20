/**
 * Campaigns Integration Layer
 * Gate-K: D1 Standard - M2 Campaigns Module
 * 
 * Provides complete CRUD operations for campaigns with proper error handling
 */

import { supabase } from '@/integrations/supabase/client';
import type { Campaign, CampaignStatus } from '../types/campaign.types';

export type CampaignsQueryParams = {
  search?: string;
  status?: CampaignStatus | 'all';
  startFrom?: string; // ISO date
  endTo?: string;     // ISO date
  page?: number;      // 1-based
  pageSize?: number;  // default 10
};

type CampaignsListResult = {
  data: Campaign[] | null;
  total: number;
  error: string | null;
};

type CampaignByIdResult = {
  data: Campaign | null;
  error: string | null;
};

/**
 * Fetch campaigns list with filters and pagination
 */
export async function fetchCampaignsList(params: CampaignsQueryParams = {}): Promise<CampaignsListResult> {
  const { search = '', status = 'all', startFrom, endTo, page = 1, pageSize = 10 } = params;

  try {
    // Base query
    let q = supabase
      .from('awareness_campaigns')
      .select(`
        id, name, description, status, start_date, end_date, owner_name, created_at, updated_at
      `, { count: 'exact' });

    // Apply filters
    if (search?.trim()) {
      q = q.ilike('name', `%${search.trim()}%`);
    }
    if (status && status !== 'all') {
      q = q.eq('status', status);
    }
    if (startFrom) {
      q = q.gte('start_date', startFrom);
    }
    if (endTo) {
      q = q.lte('end_date', endTo);
    }

    // Pagination (1-based page)
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    q = q.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await q;

    if (error) {
      return { data: null, total: 0, error: error.message };
    }

    // Map DB columns to TypeScript interface
    const mapped = (data ?? []).map((r: any): Campaign => ({
      id: r.id,
      name: r.name,
      description: r.description ?? undefined,
      status: r.status,
      startDate: r.start_date ?? undefined,
      endDate: r.end_date ?? undefined,
      ownerName: r.owner_name ?? undefined,
      createdAt: r.created_at ?? undefined,
      updatedAt: r.updated_at ?? undefined,
    }));

    return { data: mapped, total: count ?? mapped.length, error: null };
  } catch (err) {
    return { data: null, total: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Fetch a single campaign by ID
 */
export async function fetchCampaignById(id: string): Promise<CampaignByIdResult> {
  try {
    const { data, error } = await supabase
      .from('awareness_campaigns')
      .select(`id, name, description, status, start_date, end_date, owner_name, created_at, updated_at`)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: null };
    }

    // Map DB columns to TypeScript interface
    const campaign: Campaign = {
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

    return { data: campaign, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>,
  tenantId: string,
  userId: string
): Promise<CampaignByIdResult> {
  try {
    const { data, error } = await supabase
      .from('awareness_campaigns')
      .insert({
        tenant_id: tenantId,
        name: campaign.name,
        description: campaign.description || null,
        status: campaign.status,
        start_date: campaign.startDate || null,
        end_date: campaign.endDate || null,
        owner_name: campaign.ownerName || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const mapped: Campaign = {
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

    return { data: mapped, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(
  id: string,
  updates: Partial<Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<CampaignByIdResult> {
  try {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description || null;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.startDate !== undefined) payload.start_date = updates.startDate || null;
    if (updates.endDate !== undefined) payload.end_date = updates.endDate || null;
    if (updates.ownerName !== undefined) payload.owner_name = updates.ownerName || null;

    const { data, error } = await supabase
      .from('awareness_campaigns')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const mapped: Campaign = {
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

    return { data: mapped, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Delete a campaign (soft delete via archived_at)
 */
export async function deleteCampaign(id: string, userId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('awareness_campaigns')
      .update({
        archived_at: new Date().toISOString(),
        archived_by: userId,
      })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Restore a campaign (unarchive)
 */
export async function restoreCampaign(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('awareness_campaigns')
      .update({
        archived_at: null,
        archived_by: null,
      })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
