/**
 * Predictive Analytics - Performance Metrics
 */

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/ui/page-header';
import { Activity, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Progress } from '@/core/components/ui/progress';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { usePerformanceMetrics, usePredictionModels } from '@/modules/analytics/hooks/usePredictiveAnalytics';
import { format } from 'date-fns';

export default function Performance() {
  const { t } = useTranslation();
  const { tenantId } = useAppContext();
  
  const { data: metrics, isLoading: metricsLoading } = usePerformanceMetrics(tenantId || '');
  const { data: models, isLoading: modelsLoading } = usePredictionModels(tenantId || '');

  const getModelName = (modelId: string) => {
    return models?.find((m) => m.id === modelId)?.model_name || 'Unknown Model';
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title={t('Model Performance', 'أداء النماذج')}
        description={t('Track accuracy and effectiveness', 'تتبع الدقة والفعالية')}
      />

      {metricsLoading || modelsLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : metrics && metrics.length > 0 ? (
        <div className="space-y-6">
          {/* Overall Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {t('Total Predictions', 'إجمالي التنبؤات')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.reduce((sum, m) => sum + m.total_predictions, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {t('Validated', 'متحقق منها')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.reduce((sum, m) => sum + m.validated_predictions, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {t('Average Accuracy', 'متوسط الدقة')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.reduce((sum, m) => sum + (m.accuracy || 0), 0) / metrics.length).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {t('Average MAE', 'متوسط MAE')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.reduce((sum, m) => sum + (m.mae || 0), 0) / metrics.length).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model-specific Performance */}
          <div className="grid gap-4 md:grid-cols-2">
            {metrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader>
                  <CardTitle className="text-base">{getModelName(metric.model_id)}</CardTitle>
                  <CardDescription>
                    {format(new Date(metric.period_start), 'PP')} - {format(new Date(metric.period_end), 'PP')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Accuracy */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('Accuracy', 'الدقة')}</span>
                      <span className={`font-semibold ${getPerformanceColor(metric.accuracy || 0)}`}>
                        {metric.accuracy?.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={metric.accuracy || 0} className="h-2" />
                  </div>

                  {/* Precision */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('Precision', 'الدقة')}</span>
                      <span className={`font-semibold ${getPerformanceColor(metric.precision || 0)}`}>
                        {metric.precision?.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={metric.precision || 0} className="h-2" />
                  </div>

                  {/* Recall */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('Recall', 'الاستدعاء')}</span>
                      <span className={`font-semibold ${getPerformanceColor(metric.recall || 0)}`}>
                        {metric.recall?.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={metric.recall || 0} className="h-2" />
                  </div>

                  {/* F1 Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('F1 Score', 'درجة F1')}</span>
                      <span className={`font-semibold ${getPerformanceColor(metric.f1_score || 0)}`}>
                        {metric.f1_score?.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={metric.f1_score || 0} className="h-2" />
                  </div>

                  {/* Statistics */}
                  <div className="pt-3 border-t grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">{t('MAE', 'MAE')}</div>
                      <div className="font-semibold">{metric.mae?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">{t('RMSE', 'RMSE')}</div>
                      <div className="font-semibold">{metric.rmse?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">{t('Validated', 'متحقق')}</div>
                      <div className="font-semibold">
                        {metric.validated_predictions}/{metric.total_predictions}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">{t('Correct', 'صحيحة')}</div>
                      <div className="font-semibold">
                        {metric.correct_predictions}/{metric.validated_predictions}
                      </div>
                    </div>
                  </div>

                  {/* Category Distribution */}
                  {metric.predictions_by_category && (
                    <div className="pt-3 border-t">
                      <div className="text-sm font-medium mb-2">
                        {t('Predictions by Category', 'التنبؤات حسب الفئة')}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(metric.predictions_by_category as Record<string, number>).map(([cat, count]) => (
                          <div key={cat} className="flex justify-between items-center">
                            <span className="capitalize">{cat}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('No performance data available', 'لا توجد بيانات أداء متاحة')}
            </h3>
            <p className="text-muted-foreground">
              {t('Performance metrics will appear after predictions are validated', 'ستظهر مقاييس الأداء بعد التحقق من التنبؤات')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
