/**
 * D3-M21: Committees Integration Layer
 * Provides CRUD operations for committees, members, meetings, agenda items, decisions, and follow-ups
 */

import { supabase } from '@/integrations/supabase/client';
import {
  logCommitteeAction,
  logMeetingAction,
  logDecisionAction,
  logFollowupAction,
} from '@/core/services/audit';
import {
  CommitteeGuards,
  MeetingGuards,
  DecisionGuards,
  FollowupGuards,
} from './committees-guards';

/**
 * Get current tenant ID from user context
 */
async function getCurrentTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  return data?.tenant_id || null;
}

/**
 * Get current user ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// ============================================================================
// COMMITTEES
// ============================================================================

/**
 * Fetch all committees for current tenant
 */
export async function fetchCommittees() {
  // Guard: Check permission
  await CommitteeGuards.requireRead();

  const { data, error } = await supabase
    .from('committees')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

/**
 * Fetch single committee by ID with members count
 */
export async function fetchCommitteeById(id: string) {
  // Guard: Check permission
  await CommitteeGuards.requireRead();

  const { data, error } = await supabase
    .from('committees')
    .select(`
      *,
      members:committee_members(count)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create new committee
 */
export async function createCommittee(committee: any) {
  // Guard: Check permission
  await CommitteeGuards.requireWrite();

  const tenantId = await getCurrentTenantId();
  const userId = await getCurrentUserId();

  if (!tenantId) throw new Error('No tenant context');
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('committees')
    .insert({
      ...committee,
      tenant_id: tenantId,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logCommitteeAction(data.id, 'create', { code: committee.code, name: committee.name });

  return data;
}

/**
 * Update existing committee
 */
export async function updateCommittee(id: string, updates: any) {
  // Guard: Check permission
  await CommitteeGuards.requireWrite();

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('committees')
    .update({
      ...updates,
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logCommitteeAction(id, 'update', updates);

  return data;
}

/**
 * Delete committee
 */
export async function deleteCommittee(id: string) {
  // Guard: Check permission
  await CommitteeGuards.requireDelete();

  const { error } = await supabase
    .from('committees')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Log audit
  await logCommitteeAction(id, 'delete');
}

// ============================================================================
// COMMITTEE MEMBERS
// ============================================================================

/**
 * Fetch members for a committee
 */
export async function fetchCommitteeMembers(committeeId: string) {
  // Guard: Check permission
  await CommitteeGuards.requireRead();

  const { data, error } = await supabase
    .from('committee_members')
    .select('*')
    .eq('committee_id', committeeId)
    .order('created_at');

  if (error) throw error;
  return data;
}

/**
 * Add member to committee
 */
export async function addCommitteeMember(member: any) {
  // Guard: Check permission
  await CommitteeGuards.requireManage();

  const { data, error } = await supabase
    .from('committee_members')
    .insert(member)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove member from committee
 */
export async function removeCommitteeMember(id: string) {
  // Guard: Check permission
  await CommitteeGuards.requireManage();

  const { error } = await supabase
    .from('committee_members')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Update committee member
 */
export async function updateCommitteeMember(id: string, updates: any) {
  const { data, error } = await supabase
    .from('committee_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// MEETINGS
// ============================================================================

/**
 * Fetch meetings for a committee
 */
export async function fetchMeetings(committeeId: string) {
  // Guard: Check permission
  await CommitteeGuards.requireRead();

  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('committee_id', committeeId)
    .order('scheduled_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch single meeting by ID with agenda items
 */
export async function fetchMeetingById(id: string) {
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      agenda_items:agenda_items(count),
      decisions:decisions(count)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create new meeting
 */
export async function createMeeting(meeting: any) {
  // Guard: Check permission
  await MeetingGuards.requireCreate();

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('meetings')
    .insert({
      ...meeting,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logMeetingAction(data.id, 'create', {
    committee_id: meeting.committee_id,
    scheduled_at: meeting.scheduled_at,
  });

  return data;
}

/**
 * Update existing meeting
 */
export async function updateMeeting(id: string, updates: any) {
  // Guard: Check permission
  await MeetingGuards.requireManage();

  const { data, error } = await supabase
    .from('meetings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logMeetingAction(id, 'update', updates);

  return data;
}

/**
 * Delete meeting
 */
export async function deleteMeeting(id: string) {
  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Log audit
  await logMeetingAction(id, 'delete');
}

// ============================================================================
// AGENDA ITEMS
// ============================================================================

/**
 * Fetch agenda items for a meeting
 */
export async function fetchAgendaItems(meetingId: string) {
  const { data, error } = await supabase
    .from('agenda_items')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('seq');

  if (error) throw error;
  return data;
}

/**
 * Create new agenda item
 */
export async function createAgendaItem(item: any) {
  const { data, error } = await supabase
    .from('agenda_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update agenda item
 */
export async function updateAgendaItem(id: string, updates: any) {
  const { data, error } = await supabase
    .from('agenda_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete agenda item
 */
export async function deleteAgendaItem(id: string) {
  const { error } = await supabase
    .from('agenda_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// DECISIONS
// ============================================================================

/**
 * Fetch decisions for a meeting
 */
export async function fetchDecisions(meetingId: string) {
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('decided_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Create new decision
 */
export async function createDecision(decision: any) {
  // Guard: Check permission
  await DecisionGuards.requireCreate();

  const { data, error } = await supabase
    .from('decisions')
    .insert(decision)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logDecisionAction(data.id, 'create', {
    meeting_id: decision.meeting_id,
    title: decision.title,
  });

  return data;
}

/**
 * Update decision
 */
export async function updateDecision(id: string, updates: any) {
  const { data, error } = await supabase
    .from('decisions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logDecisionAction(id, 'update', updates);

  return data;
}

/**
 * Delete decision
 */
export async function deleteDecision(id: string) {
  const { error } = await supabase
    .from('decisions')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Log audit
  await logDecisionAction(id, 'delete');
}

// ============================================================================
// FOLLOW-UPS
// ============================================================================

/**
 * Fetch follow-ups for a meeting
 */
export async function fetchFollowups(meetingId: string) {
  const { data, error } = await supabase
    .from('followups')
    .select(`
      *,
      decision:decisions!inner(meeting_id)
    `)
    .eq('decision.meeting_id', meetingId)
    .order('due_at');

  if (error) throw error;
  return data;
}

/**
 * Fetch follow-ups by meeting_id (using denormalized field)
 * Faster query when meeting_id is populated
 */
export async function fetchFollowupsByMeeting(meetingId: string) {
  const { data, error } = await supabase
    .from('followups')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('due_at');

  if (error) throw error;
  return data;
}

/**
 * Fetch all pending follow-ups for a committee
 */
export async function fetchPendingFollowups(committeeId: string) {
  const { data, error } = await supabase
    .from('followups')
    .select(`
      *,
      decision:decisions!inner(
        meeting:meetings!inner(committee_id)
      )
    `)
    .eq('decision.meeting.committee_id', committeeId)
    .eq('status', 'pending')
    .order('due_at');

  if (error) throw error;
  return data;
}

/**
 * Create new follow-up
 * Automatically populates meeting_id from decision
 */
export async function createFollowup(followup: any) {
  // Guard: Check permission
  await FollowupGuards.requireManage();

  // Get meeting_id from decision if not provided
  let meetingId = followup.meeting_id;
  
  if (!meetingId && followup.decision_id) {
    const { data: decision } = await supabase
      .from('decisions')
      .select('meeting_id')
      .eq('id', followup.decision_id)
      .single();
    
    meetingId = decision?.meeting_id;
  }

  const { data, error } = await supabase
    .from('followups')
    .insert({
      ...followup,
      meeting_id: meetingId,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logFollowupAction(data.id, 'create', {
    decision_id: followup.decision_id,
    title: followup.title,
  });

  return data;
}

/**
 * Update follow-up
 */
export async function updateFollowup(id: string, updates: any) {
  // Guard: Check permission
  await FollowupGuards.requireManage();

  const { data, error } = await supabase
    .from('followups')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logFollowupAction(id, 'update', updates);

  return data;
}

/**
 * Delete follow-up
 */
export async function deleteFollowup(id: string) {
  const { error } = await supabase
    .from('followups')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Log audit
  await logFollowupAction(id, 'delete');
}

/**
 * Mark follow-up as complete
 */
export async function completeFollowup(id: string, completionNotes?: string) {
  const result = await updateFollowup(id, {
    status: 'done',
    completed_at: new Date().toISOString(),
    completion_notes: completionNotes,
  });

  // Log completion action
  await logFollowupAction(id, 'complete', { completion_notes: completionNotes });

  return result;
}
