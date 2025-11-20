import { supabase } from '@/integrations/supabase/client';
import type { Participant, ParticipantUpsert, ParticipantsFilters } from '@/modules/campaigns';

export async function fetchParticipants(
  campaignId: string,
  filters: ParticipantsFilters,
  page: number,
  pageSize: number
): Promise<{ data: Participant[]; total: number }> {
  let query = supabase
    .from('campaign_participants')
    .select('*', { count: 'exact' })
    .eq('campaign_id', campaignId);

  // Exclude deleted by default
  if (!filters.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  // Apply filters
  if (filters.q?.trim()) {
    query = query.ilike('employee_ref', `%${filters.q.trim()}%`);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.scoreGte !== null && filters.scoreGte !== undefined) {
    query = query.gte('score', filters.scoreGte);
  }

  if (filters.from) {
    query = query.gte('completed_at', filters.from);
  }

  if (filters.to) {
    query = query.lte('completed_at', filters.to);
  }

  // Apply sorting
  const ascending = filters.sortDir === 'asc';
  query = query.order(filters.sortBy, { ascending });

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []).map(mapParticipant),
    total: count ?? 0,
  };
}

export async function fetchParticipantsMetrics(campaignId: string, campaignEndDate?: string | null) {
  const { data, error } = await supabase
    .from('campaign_participants')
    .select('id, status, score, completed_at')
    .eq('campaign_id', campaignId)
    .is('deleted_at', null);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const total = rows.length;
  const started = rows.filter(r => r.status === 'in_progress' || r.status === 'completed').length;
  const completed = rows.filter(r => r.status === 'completed').length;

  // Calculate Avg Score from quiz_submissions if present, fallback to manual scores
  const participantIds = rows.map(r => r.id);
  
  let avgScore: number | null = null;
  
  if (participantIds.length > 0) {
    // Try to get scores from quiz_submissions first
    const { data: submissions } = await supabase
      .from('quiz_submissions')
      .select('participant_id, score, passed')
      .in('participant_id', participantIds)
      .order('submitted_at', { ascending: false });

    const submissionScores: number[] = [];
    const participantsWithSubmissions = new Set<string>();

    if (submissions && submissions.length > 0) {
      // Group by participant and get best score (latest passed OR highest)
      const participantSubmissions = new Map<string, any[]>();
      submissions.forEach(sub => {
        if (!participantSubmissions.has(sub.participant_id)) {
          participantSubmissions.set(sub.participant_id, []);
        }
        participantSubmissions.get(sub.participant_id)!.push(sub);
      });

      participantSubmissions.forEach((subs, participantId) => {
        // Latest passed
        const latestPassed = subs.find(s => s.passed);
        if (latestPassed) {
          submissionScores.push(parseFloat(latestPassed.score));
          participantsWithSubmissions.add(participantId);
        } else {
          // Highest score
          const highest = subs.reduce((max, s) => {
            const score = parseFloat(s.score);
            return score > max ? score : max;
          }, 0);
          submissionScores.push(highest);
          participantsWithSubmissions.add(participantId);
        }
      });
    }

    // Add manual scores for participants without submissions (backward compatibility)
    const manualScores = rows
      .filter(r => r.score !== null && !participantsWithSubmissions.has(r.id))
      .map(r => r.score!);

    const allScores = [...submissionScores, ...manualScores];
    avgScore = allScores.length > 0 
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length 
      : null;
  }

  let overdue = 0;
  if (campaignEndDate) {
    const endDate = new Date(campaignEndDate);
    overdue = rows.filter(r => !r.completed_at && new Date() > endDate).length;
  }

  return {
    total,
    started,
    completed,
    avgScore,
    overdue,
    breakdown: {
      not_started: rows.filter(r => r.status === 'not_started').length,
      in_progress: rows.filter(r => r.status === 'in_progress').length,
      completed,
    },
  };
}

export async function upsertParticipant(tenantId: string, data: ParticipantUpsert) {
  // Check if exists
  const { data: existing } = await supabase
    .from('campaign_participants')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('campaign_id', data.campaignId)
    .eq('employee_ref', data.employeeRef)
    .is('deleted_at', null)
    .maybeSingle();

  if (existing) {
    // Update
    const { error } = await supabase
      .from('campaign_participants')
      .update({
        status: data.status,
        score: data.score,
        completed_at: data.completedAt,
        notes: data.notes,
      })
      .eq('id', existing.id);

    if (error) throw new Error(error.message);
    return { id: existing.id, action: 'updated' };
  } else {
    // Insert
    const { data: inserted, error } = await supabase
      .from('campaign_participants')
      .insert({
        tenant_id: tenantId,
        campaign_id: data.campaignId,
        employee_ref: data.employeeRef,
        status: data.status ?? 'not_started',
        score: data.score ?? null,
        completed_at: data.completedAt ?? null,
        notes: data.notes ?? null,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return { id: inserted.id, action: 'inserted' };
  }
}

export async function bulkUpdateParticipants(
  ids: string[],
  patch: { status?: string; score?: number | null; notes?: string | null; completed_at?: string | null }
) {
  if (!ids.length) return 0;

  const { error } = await supabase
    .from('campaign_participants')
    .update(patch)
    .in('id', ids);

  if (error) throw new Error(error.message);
  return ids.length;
}

export async function bulkSoftDeleteParticipants(ids: string[]) {
  if (!ids.length) return 0;

  const { error } = await supabase
    .from('campaign_participants')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', ids);

  if (error) throw new Error(error.message);
  return ids.length;
}

export async function bulkUndeleteParticipants(ids: string[]) {
  if (!ids.length) return 0;

  const { error } = await supabase
    .from('campaign_participants')
    .update({ deleted_at: null })
    .in('id', ids);

  if (error) throw new Error(error.message);
  return ids.length;
}

function mapParticipant(raw: any): Participant {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    campaignId: raw.campaign_id,
    employeeRef: raw.employee_ref,
    status: raw.status,
    score: raw.score,
    completedAt: raw.completed_at,
    notes: raw.notes,
    deletedAt: raw.deleted_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
