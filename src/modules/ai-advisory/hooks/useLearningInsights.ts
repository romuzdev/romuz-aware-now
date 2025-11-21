/**
 * M16: AI Advisory Engine - Learning Insights Hook
 * Track and analyze AI recommendation performance
 */

import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { supabase } from '@/integrations/supabase/client';

export interface LearningMetrics {
  contextType: string;
  feedbackCount: number;
  acceptanceRate: number;
  avgConfidenceScore: number;
  avgFeedbackRating: number;
  commonRejectionReasons: string[];
  improvementSuggestions: any;
  modelPerformanceScore: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Fetch learning metrics for AI recommendations
 */
export function useLearningInsights(filters?: {
  contextType?: string;
  days?: number;
}) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['ai-learning-metrics', tenantId, filters],
    queryFn: async () => {
      let query = supabase
        .from('ai_learning_metrics')
        .select('*')
        .eq('tenant_id', tenantId!)
        .order('period_end', { ascending: false });

      if (filters?.contextType) {
        query = query.eq('context_type', filters.contextType);
      }

      if (filters?.days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - filters.days);
        query = query.gte('period_start', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LearningMetrics[];
    },
    enabled: !!tenantId,
  });
}

/**
 * Get aggregated learning insights across all recommendations
 */
export function useAggregatedLearningInsights(days = 30) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['ai-learning-insights-aggregated', tenantId, days],
    queryFn: async () => {
      // Get all recommendations with feedback in the specified period
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: recommendations, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('tenant_id', tenantId!)
        .not('feedback_rating', 'is', null)
        .gte('feedback_at', startDate.toISOString());

      if (error) throw error;

      // Calculate aggregated metrics
      const totalRecommendations = recommendations.length;
      const acceptedCount = recommendations.filter((r) => r.status === 'accepted').length;
      const implementedCount = recommendations.filter((r) => r.status === 'implemented').length;
      const rejectedCount = recommendations.filter((r) => r.status === 'rejected').length;

      const avgConfidence =
        recommendations.reduce((sum, r) => sum + (r.confidence_score || 0), 0) /
        totalRecommendations || 0;

      const avgRating =
        recommendations.reduce((sum, r) => sum + (r.feedback_rating || 0), 0) /
        totalRecommendations || 0;

      // Group by context type
      const byContextType: Record<string, number> = {};
      recommendations.forEach((r) => {
        byContextType[r.context_type] = (byContextType[r.context_type] || 0) + 1;
      });

      // Group by priority
      const byPriority: Record<string, number> = {};
      recommendations.forEach((r) => {
        byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
      });

      // Common rejection reasons
      const rejectionReasons: Record<string, number> = {};
      recommendations
        .filter((r) => r.status === 'rejected' && r.feedback_comment)
        .forEach((r) => {
          const reason = r.feedback_comment || 'No reason provided';
          rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
        });

      const topRejectionReasons = Object.entries(rejectionReasons)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count }));

      return {
        totalRecommendations,
        acceptedCount,
        implementedCount,
        rejectedCount,
        acceptanceRate: totalRecommendations > 0 ? (acceptedCount / totalRecommendations) * 100 : 0,
        implementationRate:
          totalRecommendations > 0 ? (implementedCount / totalRecommendations) * 100 : 0,
        rejectionRate: totalRecommendations > 0 ? (rejectedCount / totalRecommendations) * 100 : 0,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        avgRating: Math.round(avgRating * 10) / 10,
        byContextType,
        byPriority,
        topRejectionReasons,
      };
    },
    enabled: !!tenantId,
  });
}

/**
 * Get improvement suggestions based on learning metrics
 */
export function useImprovementSuggestions() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['ai-improvement-suggestions', tenantId],
    queryFn: async () => {
      // Get recent learning metrics
      const { data: metrics, error } = await supabase
        .from('ai_learning_metrics')
        .select('*')
        .eq('tenant_id', tenantId!)
        .order('period_end', { ascending: false })
        .limit(10);

      if (error) throw error;

      const suggestions: Array<{
        area: string;
        issue: string;
        recommendation: string;
        priority: 'high' | 'medium' | 'low';
      }> = [];

      // Analyze metrics and generate suggestions
      metrics.forEach((metric) => {
        // Low acceptance rate
        if (metric.acceptance_rate < 50) {
          suggestions.push({
            area: metric.context_type,
            issue: 'معدل قبول منخفض للتوصيات',
            recommendation:
              'مراجعة نوعية التوصيات وتحسين دقة النموذج من خلال تحليل أسباب الرفض الشائعة',
            priority: 'high',
          });
        }

        // Low confidence scores
        if (metric.avg_confidence_score < 0.6) {
          suggestions.push({
            area: metric.context_type,
            issue: 'درجة ثقة منخفضة في التوصيات',
            recommendation: 'تحسين جودة البيانات المدخلة وتوسيع قاعدة البيانات التدريبية',
            priority: 'medium',
          });
        }

        // Low feedback ratings
        if (metric.avg_feedback_rating < 3) {
          suggestions.push({
            area: metric.context_type,
            issue: 'تقييمات سلبية من المستخدمين',
            recommendation:
              'مراجعة عمق التحليل وتحسين وضوح التوصيات وتخصيصها بشكل أفضل',
            priority: 'high',
          });
        }
      });

      // Remove duplicates and sort by priority
      const uniqueSuggestions = suggestions.filter(
        (s, index, self) =>
          index ===
          self.findIndex((t) => t.area === s.area && t.issue === s.issue)
      );

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      uniqueSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return uniqueSuggestions;
    },
    enabled: !!tenantId,
  });
}
