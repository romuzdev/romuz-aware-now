/**
 * M16: AI Advisory Engine - Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  AIRecommendation,
  RecommendationRequest,
  RecommendationResponse,
  FeedbackRequest,
  RecommendationFilters,
  RecommendationStats,
  RecommendationStatus,
} from '../types/ai-advisory.types';

/**
 * Request AI recommendation
 */
export async function requestAdvisory(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-advisory', {
      body: request,
    });

    if (error) {
      console.error('AI Advisory error:', error);
      throw new Error(error.message || 'فشل في توليد التوصية');
    }

    return data as RecommendationResponse;
  } catch (err: any) {
    console.error('Request advisory error:', err);
    return {
      success: false,
      error: err.message || 'فشل في الاتصال بخدمة التوصيات الذكية',
    };
  }
}

/**
 * Fetch recommendations with filters
 */
export async function fetchRecommendations(
  tenantId: string,
  filters?: RecommendationFilters
): Promise<AIRecommendation[]> {
  let query = supabase
    .from('ai_recommendations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.context_type) {
    query = query.eq('context_type', filters.context_type);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters?.from_date) {
    query = query.gte('created_at', filters.from_date);
  }

  if (filters?.to_date) {
    query = query.lte('created_at', filters.to_date);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fetch recommendations error:', error);
    throw error;
  }

  // Client-side search filter
  let results = data || [];
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (rec) =>
        rec.title_ar?.toLowerCase().includes(searchLower) ||
        rec.title_en?.toLowerCase().includes(searchLower) ||
        rec.description_ar?.toLowerCase().includes(searchLower) ||
        rec.description_en?.toLowerCase().includes(searchLower)
    );
  }

  return results;
}

/**
 * Fetch single recommendation by ID
 */
export async function fetchRecommendationById(
  recommendationId: string
): Promise<AIRecommendation | null> {
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select('*')
    .eq('id', recommendationId)
    .single();

  if (error) {
    console.error('Fetch recommendation by ID error:', error);
    throw error;
  }

  return data;
}

/**
 * Provide feedback on recommendation
 */
export async function provideFeedback(
  request: FeedbackRequest
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('ai_recommendations')
    .update({
      feedback_rating: request.rating,
      feedback_comment: request.comment,
      feedback_at: new Date().toISOString(),
      feedback_by: user.id,
    })
    .eq('id', request.recommendation_id);

  if (error) {
    console.error('Provide feedback error:', error);
    throw error;
  }

  // Log decision
  const { data: rec } = await supabase
    .from('ai_recommendations')
    .select('tenant_id, context_type, context_id')
    .eq('id', request.recommendation_id)
    .single();

  if (rec) {
    await supabase.from('ai_decision_logs').insert({
      tenant_id: rec.tenant_id,
      recommendation_id: request.recommendation_id,
      context_type: rec.context_type,
      context_id: rec.context_id,
      decision_type: 'feedback_provided',
      decision_maker: user.id,
      outcome: 'success',
      outcome_details: { rating: request.rating, comment: request.comment },
    });
  }
}

/**
 * Accept recommendation
 */
export async function acceptRecommendation(
  recommendationId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('ai_recommendations')
    .update({
      status: 'accepted' as RecommendationStatus,
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq('id', recommendationId);

  if (error) {
    console.error('Accept recommendation error:', error);
    throw error;
  }

  // Log decision
  const { data: rec } = await supabase
    .from('ai_recommendations')
    .select('tenant_id, context_type, context_id')
    .eq('id', recommendationId)
    .single();

  if (rec) {
    await supabase.from('ai_decision_logs').insert({
      tenant_id: rec.tenant_id,
      recommendation_id: recommendationId,
      context_type: rec.context_type,
      context_id: rec.context_id,
      decision_type: 'recommendation_accepted',
      decision_maker: user.id,
      outcome: 'success',
    });
  }
}

/**
 * Reject recommendation
 */
export async function rejectRecommendation(
  recommendationId: string,
  reason?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('ai_recommendations')
    .update({
      status: 'rejected' as RecommendationStatus,
      rejected_at: new Date().toISOString(),
      rejected_by: user.id,
      feedback_comment: reason,
    })
    .eq('id', recommendationId);

  if (error) {
    console.error('Reject recommendation error:', error);
    throw error;
  }

  // Log decision
  const { data: rec } = await supabase
    .from('ai_recommendations')
    .select('tenant_id, context_type, context_id')
    .eq('id', recommendationId)
    .single();

  if (rec) {
    await supabase.from('ai_decision_logs').insert({
      tenant_id: rec.tenant_id,
      recommendation_id: recommendationId,
      context_type: rec.context_type,
      context_id: rec.context_id,
      decision_type: 'recommendation_rejected',
      decision_maker: user.id,
      outcome: 'success',
      outcome_details: { reason },
    });
  }
}

/**
 * Mark recommendation as implemented
 */
export async function implementRecommendation(
  recommendationId: string,
  notes?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('ai_recommendations')
    .update({
      status: 'implemented' as RecommendationStatus,
      implemented_at: new Date().toISOString(),
      implemented_by: user.id,
      implementation_notes: notes,
    })
    .eq('id', recommendationId);

  if (error) {
    console.error('Implement recommendation error:', error);
    throw error;
  }

  // Log decision
  const { data: rec } = await supabase
    .from('ai_recommendations')
    .select('tenant_id, context_type, context_id')
    .eq('id', recommendationId)
    .single();

  if (rec) {
    await supabase.from('ai_decision_logs').insert({
      tenant_id: rec.tenant_id,
      recommendation_id: recommendationId,
      context_type: rec.context_type,
      context_id: rec.context_id,
      decision_type: 'recommendation_implemented',
      decision_maker: user.id,
      outcome: 'success',
      outcome_details: { notes },
    });
  }
}

/**
 * Fetch recommendation statistics
 */
export async function fetchRecommendationStats(
  tenantId: string
): Promise<RecommendationStats> {
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Fetch recommendation stats error:', error);
    throw error;
  }

  const recs = data || [];

  const stats: RecommendationStats = {
    total: recs.length,
    pending: recs.filter((r) => r.status === 'pending').length,
    accepted: recs.filter((r) => r.status === 'accepted').length,
    rejected: recs.filter((r) => r.status === 'rejected').length,
    implemented: recs.filter((r) => r.status === 'implemented').length,
    expired: recs.filter((r) => r.status === 'expired').length,
    avg_confidence:
      recs.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / recs.length || 0,
    avg_feedback_rating:
      recs.filter((r) => r.feedback_rating).length > 0
        ? recs.reduce((sum, r) => sum + (r.feedback_rating || 0), 0) /
          recs.filter((r) => r.feedback_rating).length
        : undefined,
    by_priority: {
      critical: recs.filter((r) => r.priority === 'critical').length,
      high: recs.filter((r) => r.priority === 'high').length,
      medium: recs.filter((r) => r.priority === 'medium').length,
      low: recs.filter((r) => r.priority === 'low').length,
    },
    by_context: {
      risk: recs.filter((r) => r.context_type === 'risk').length,
      compliance: recs.filter((r) => r.context_type === 'compliance').length,
      audit: recs.filter((r) => r.context_type === 'audit').length,
      campaign: recs.filter((r) => r.context_type === 'campaign').length,
      policy: recs.filter((r) => r.context_type === 'policy').length,
      action_plan: recs.filter((r) => r.context_type === 'action_plan').length,
      incident: recs.filter((r) => r.context_type === 'incident').length,
      security_event: recs.filter((r) => r.context_type === 'security_event').length,
    },
  };

  return stats;
}

/**
 * Delete recommendation (admin only)
 */
export async function deleteRecommendation(
  recommendationId: string
): Promise<void> {
  const { error } = await supabase
    .from('ai_recommendations')
    .delete()
    .eq('id', recommendationId);

  if (error) {
    console.error('Delete recommendation error:', error);
    throw error;
  }
}
