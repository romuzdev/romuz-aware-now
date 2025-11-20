/**
 * Predictive Insights Panel Component
 * Week 4 - Phase 3
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { usePredictiveInsights } from '../hooks/useAnalytics';
import type { AnalyticsFilters } from '../types/analytics.types';

interface PredictiveInsightsPanelProps {
  filters: AnalyticsFilters;
}

export function PredictiveInsightsPanel({ filters }: PredictiveInsightsPanelProps) {
  const { data: insights, isLoading } = usePredictiveInsights(filters);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return { variant: 'default' as const, label: 'عالية' };
    if (confidence >= 0.5) return { variant: 'secondary' as const, label: 'متوسطة' };
    return { variant: 'outline' as const, label: 'منخفضة' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            رؤى تنبؤية
          </CardTitle>
          <CardDescription>تحليلات تنبؤية مدعومة بالذكاء الاصطناعي</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">جاري التحليل...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          رؤى تنبؤية
        </CardTitle>
        <CardDescription>تحليلات تنبؤية مدعومة بالذكاء الاصطناعي</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights?.map((insight) => {
            const confidenceBadge = getConfidenceBadge(insight.confidence);
            
            return (
              <div
                key={insight.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">{insight.metric}</h4>
                  </div>
                  <Badge variant={confidenceBadge.variant}>
                    ثقة {confidenceBadge.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">التوقع:</span>
                    <span className="font-semibold ml-2">{insight.prediction.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الإطار الزمني:</span>
                    <span className="font-semibold ml-2">{insight.timeframe}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {insight.factors.map((factor, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                  <p className="text-sm">{insight.recommendation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
