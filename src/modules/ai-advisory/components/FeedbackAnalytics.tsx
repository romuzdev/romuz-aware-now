/**
 * M16: AI Advisory Engine - Feedback Analytics Component
 * Visual analytics for AI recommendation feedback and learning
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { useAggregatedLearningInsights, useImprovementSuggestions } from '../hooks/useLearningInsights';
import { Progress } from '@/core/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/core/components/ui/alert';
import { AlertCircle, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/core/components/ui/skeleton';

export function FeedbackAnalytics({ days = 30 }: { days?: number }) {
  const { data: insights, isLoading: insightsLoading } = useAggregatedLearningInsights(days);
  const { data: suggestions, isLoading: suggestionsLoading } = useImprovementSuggestions();

  if (insightsLoading || suggestionsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التوصيات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalRecommendations}</div>
            <p className="text-xs text-muted-foreground">
              خلال آخر {days} يوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل القبول</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.acceptanceRate.toFixed(1)}%</div>
            <Progress value={insights.acceptanceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل التنفيذ</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.implementationRate.toFixed(1)}%</div>
            <Progress value={insights.implementationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط التقييم</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.avgRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              ثقة: {insights.avgConfidence.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* By Context Type */}
      <Card>
        <CardHeader>
          <CardTitle>التوصيات حسب السياق</CardTitle>
          <CardDescription>توزيع التوصيات عبر أنواع السياقات المختلفة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(insights.byContextType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{type}</Badge>
                  <span className="text-sm text-muted-foreground">{count} توصية</span>
                </div>
                <Progress
                  value={(count / insights.totalRecommendations) * 100}
                  className="w-32"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Rejection Reasons */}
      {insights.topRejectionReasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>أسباب الرفض الشائعة</CardTitle>
            <CardDescription>الأسباب الأكثر تكراراً لرفض التوصيات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.topRejectionReasons.map((reason, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{reason.reason}</p>
                    <p className="text-xs text-muted-foreground">{reason.count} مرة</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvement Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>توصيات التحسين</CardTitle>
            <CardDescription>مقترحات لتحسين جودة التوصيات الذكية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <Alert
                  key={index}
                  variant={suggestion.priority === 'high' ? 'destructive' : 'default'}
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-2">
                    {suggestion.area}
                    <Badge
                      variant={
                        suggestion.priority === 'high'
                          ? 'destructive'
                          : suggestion.priority === 'medium'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {suggestion.priority === 'high'
                        ? 'عالي'
                        : suggestion.priority === 'medium'
                        ? 'متوسط'
                        : 'منخفض'}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-1">
                    <p className="font-medium text-sm">{suggestion.issue}</p>
                    <p className="text-sm">{suggestion.recommendation}</p>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
