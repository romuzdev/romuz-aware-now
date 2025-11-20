/**
 * M16: AI Advisory Engine - Insights Widget for Dashboard
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Sparkles, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { useAIAdvisory } from '../hooks/useAIAdvisory';
import { useRecommendationStats } from '../hooks/useRecommendationStats';
import { Link } from 'react-router-dom';

interface AIInsightsWidgetProps {
  maxItems?: number;
  showStats?: boolean;
}

export function AIInsightsWidget({ maxItems = 3, showStats = true }: AIInsightsWidgetProps) {
  const { recommendations, isLoading } = useAIAdvisory({ status: 'pending' });
  const { stats, isLoading: statsLoading } = useRecommendationStats();

  const latestRecommendations = recommendations.slice(0, maxItems);

  if (isLoading || statsLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>رؤى ذكية</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>رؤى ذكية</CardTitle>
              <CardDescription>توصيات مدعومة بالذكاء الاصطناعي</CardDescription>
            </div>
          </div>
          <Link to="/ai-recommendations">
            <Button variant="ghost" size="sm" className="gap-1">
              عرض الكل
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Summary */}
        {showStats && stats && (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-muted/50 rounded-md">
              <div className="text-2xl font-bold text-primary">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">قيد المراجعة</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-md">
              <div className="text-2xl font-bold text-green-600">{stats.implemented}</div>
              <div className="text-xs text-muted-foreground">تم التنفيذ</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-md">
              <div className="text-2xl font-bold text-orange-600">
                {stats.by_priority.critical + stats.by_priority.high}
              </div>
              <div className="text-xs text-muted-foreground">عالية الأولوية</div>
            </div>
          </div>
        )}

        {/* Latest Recommendations */}
        {latestRecommendations.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-primary" />
              أحدث التوصيات
            </div>
            {latestRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium line-clamp-2">{rec.title_ar}</p>
                  <Badge
                    className={
                      rec.priority === 'critical'
                        ? 'bg-destructive text-destructive-foreground'
                        : rec.priority === 'high'
                        ? 'bg-orange-500 text-white'
                        : 'bg-blue-500 text-white'
                    }
                  >
                    {rec.priority === 'critical'
                      ? 'حرج'
                      : rec.priority === 'high'
                      ? 'عالي'
                      : rec.priority === 'medium'
                      ? 'متوسط'
                      : 'منخفض'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {rec.description_ar}
                </p>
                {rec.confidence_score && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      ثقة {Math.round(rec.confidence_score * 100)}%
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            لا توجد توصيات جديدة حالياً
          </div>
        )}
      </CardContent>
    </Card>
  );
}
