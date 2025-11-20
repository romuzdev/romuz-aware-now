/**
 * Executive Summary Card Component
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useExecutiveSummary } from '../hooks/useUnifiedKPIs';
import { Skeleton } from '@/core/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export function ExecutiveSummaryCard() {
  const { data: summary, isLoading } = useExecutiveSummary();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!summary || summary.length === 0) {
    return null;
  }

  const totalKPIs = summary.reduce((sum, s) => sum + s.total_kpis, 0);
  const avgAchievement = summary.reduce((sum, s) => sum + s.achievement_rate, 0) / summary.length;
  const totalCritical = summary.reduce((sum, s) => sum + s.critical_count, 0);

  const topPerformers = [...summary]
    .sort((a, b) => b.achievement_rate - a.achievement_rate)
    .slice(0, 3);
  
  const needsAttention = [...summary]
    .filter(s => s.critical_count > 0)
    .sort((a, b) => b.critical_count - a.critical_count)
    .slice(0, 3);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>الملخص التنفيذي</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{totalKPIs}</p>
            <p className="text-sm text-muted-foreground">إجمالي المؤشرات</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-success">{avgAchievement.toFixed(0)}%</p>
            <p className="text-sm text-muted-foreground">معدل الإنجاز</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-destructive">{totalCritical}</p>
            <p className="text-sm text-muted-foreground">مؤشرات حرجة</p>
          </div>
        </div>

        {/* Top Performers */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            أفضل الأداءات
          </h3>
          <div className="space-y-2">
            {topPerformers.map((item, idx) => (
              <div key={item.module} className="flex justify-between items-center p-2 bg-success/5 rounded">
                <span className="text-sm">{idx + 1}. {item.module}</span>
                <span className="font-semibold text-success">{item.achievement_rate.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              يتطلب انتباهاً
            </h3>
            <div className="space-y-2">
              {needsAttention.map((item) => (
                <div key={item.module} className="flex justify-between items-center p-2 bg-destructive/5 rounded">
                  <span className="text-sm">{item.module}</span>
                  <span className="font-semibold text-destructive">{item.critical_count} حرج</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
