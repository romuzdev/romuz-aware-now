/**
 * Actions AI Integration
 * M11: AI-powered recommendations and insights
 */

import { supabase } from '@/integrations/supabase/client';

export type AnalysisType = 'suggestions' | 'risk_assessment' | 'optimization' | 'next_steps';

export interface AISuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}

export interface AIRisk {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface AIOptimization {
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export interface AINextStep {
  order: number;
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIRecommendationsResponse {
  success: boolean;
  action_id: string;
  analysis_type: AnalysisType;
  recommendations: AISuggestion[] | AIRisk[] | AIOptimization[] | AINextStep[];
  generated_at: string;
  error?: string;
}

/**
 * Get AI-powered recommendations for an action
 */
export async function getAIRecommendations(
  actionId: string,
  analysisType: AnalysisType,
  tenantId: string
): Promise<AIRecommendationsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('action-ai-recommendations', {
      body: {
        action_id: actionId,
        analysis_type: analysisType,
        tenant_id: tenantId,
      },
    });

    if (error) {
      console.error('AI recommendations error:', error);
      throw new Error(error.message || 'Failed to get AI recommendations');
    }

    return data as AIRecommendationsResponse;
  } catch (err: any) {
    console.error('Get AI recommendations error:', err);
    throw new Error(err.message || 'Failed to fetch AI recommendations');
  }
}

/**
 * Get suggestions for improving the action
 */
export async function getActionSuggestions(
  actionId: string,
  tenantId: string
): Promise<AISuggestion[]> {
  const response = await getAIRecommendations(actionId, 'suggestions', tenantId);
  return response.recommendations as AISuggestion[];
}

/**
 * Get risk assessment for the action
 */
export async function getActionRisks(
  actionId: string,
  tenantId: string
): Promise<AIRisk[]> {
  const response = await getAIRecommendations(actionId, 'risk_assessment', tenantId);
  return response.recommendations as AIRisk[];
}

/**
 * Get optimization suggestions
 */
export async function getActionOptimizations(
  actionId: string,
  tenantId: string
): Promise<AIOptimization[]> {
  const response = await getAIRecommendations(actionId, 'optimization', tenantId);
  return response.recommendations as AIOptimization[];
}

/**
 * Get suggested next steps
 */
export async function getActionNextSteps(
  actionId: string,
  tenantId: string
): Promise<AINextStep[]> {
  const response = await getAIRecommendations(actionId, 'next_steps', tenantId);
  return response.recommendations as AINextStep[];
}
