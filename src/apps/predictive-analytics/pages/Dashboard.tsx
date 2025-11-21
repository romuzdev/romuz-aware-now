/**
 * Predictive Analytics - Dashboard
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/ui/page-header';
import { TrendingUp, Brain, Target, AlertTriangle, Plus, Sparkles, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { 
  usePredictionModels, 
  usePredictions, 
  usePredictionStats,
  useInitializeModels,
  useSeedData
} from '@/modules/analytics/hooks/usePredictiveAnalytics';
import { format } from 'date-fns';
import { CreatePredictionDialog } from '../components/CreatePredictionDialog';

export default function Dashboard() {
  const { t } = useTranslation();
  const { tenantId } = useAppContext();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { data: stats, isLoading: statsLoading } = usePredictionStats(tenantId || '');
  const { data: models, isLoading: modelsLoading } = usePredictionModels(tenantId || '', { is_active: true });
  const { data: predictions, isLoading: predictionsLoading } = usePredictions(tenantId || '');
  const initModels = useInitializeModels();
  const seedData = useSeedData();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title={t('Predictive Analytics Dashboard', 'لوحة التحكم - التحليلات التنبؤية')}
        description={t('AI-powered predictions and insights', 'تنبؤات ورؤى مدعومة بالذكاء الاصطناعي')}
        actions={
          <div className="flex gap-2">
            {!models?.length ? (
              <Button
                onClick={() => initModels.mutate()}
                disabled={initModels.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('Initialize Models', 'تهيئة النماذج')}
              </Button>
            ) : (
              <>
                {!predictions?.length && (
                  <Button
                    variant="outline"
                    onClick={() => seedData.mutate()}
                    disabled={seedData.isPending}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    {t('Add Sample Data', 'إضافة بيانات تجريبية')}
                  </Button>
                )}
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('New Prediction', 'تنبؤ جديد')}
                </Button>
              </>
            )}
          </div>
        }
      />

      <CreatePredictionDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('Active Models', 'النماذج النشطة')}
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalModels || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {t('Ready for predictions', 'جاهزة للتنبؤات')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('Total Predictions', 'إجمالي التنبؤات')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalPredictions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {t('All time', 'على الإطلاق')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('Average Accuracy', 'متوسط الدقة')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.averageAccuracy ? `${stats.averageAccuracy.toFixed(1)}%` : '-'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.averageAccuracy ? t('Based on validated predictions', 'بناءً على التنبؤات المتحققة') : t('No data yet', 'لا توجد بيانات بعد')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('High Risk Predictions', 'تنبؤات عالية المخاطر')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.highRiskPredictions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {t('Requires attention', 'تحتاج انتباه')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">
            {t('Recent Predictions', 'التنبؤات الأخيرة')}
          </TabsTrigger>
          <TabsTrigger value="insights">
            {t('Key Insights', 'الرؤى الرئيسية')}
          </TabsTrigger>
          <TabsTrigger value="trends">
            {t('Trends', 'الاتجاهات')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('Recent Predictions', 'التنبؤات الأخيرة')}</CardTitle>
              <CardDescription>
                {t('Latest predictions across all models', 'آخر التنبؤات عبر جميع النماذج')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : predictions && predictions.length > 0 ? (
                <div className="space-y-4">
                  {predictions.slice(0, 5).map((prediction) => (
                    <div
                      key={prediction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prediction.prediction_type}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              prediction.predicted_category === 'critical'
                                ? 'bg-destructive/10 text-destructive'
                                : prediction.predicted_category === 'high'
                                ? 'bg-orange-500/10 text-orange-500'
                                : prediction.predicted_category === 'medium'
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-green-500/10 text-green-500'
                            }`}
                          >
                            {prediction.predicted_category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {prediction.ai_reasoning?.slice(0, 100)}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(prediction.created_at), 'PPp')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {prediction.predicted_value?.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('Confidence', 'الثقة')}: {prediction.confidence_score?.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {t('No predictions yet. Create a model to get started.', 'لا توجد تنبؤات بعد. أنشئ نموذجاً للبدء.')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('Key Insights', 'الرؤى الرئيسية')}</CardTitle>
              <CardDescription>
                {t('AI-generated insights from your data', 'رؤى مُولّدة بالذكاء الاصطناعي من بياناتك')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {t('No insights available yet.', 'لا توجد رؤى متاحة بعد.')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('Prediction Trends', 'اتجاهات التنبؤات')}</CardTitle>
              <CardDescription>
                {t('Historical trends and patterns', 'الاتجاهات والأنماط التاريخية')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {t('No trend data available yet.', 'لا توجد بيانات اتجاهات متاحة بعد.')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
