/**
 * Predictive Analytics - Models Management
 */

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/ui/page-header';
import { Target, Activity, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { usePredictionModels } from '@/modules/analytics/hooks/usePredictiveAnalytics';
import { format } from 'date-fns';

export default function Models() {
  const { t } = useTranslation();
  const { tenantId } = useAppContext();
  
  const { data: models, isLoading } = usePredictionModels(tenantId || '');

  const getModelIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      risk: '🛡️',
      incident: '🚨',
      compliance: '✅',
      campaign: '📢',
      audit: '🔍',
      breach: '⚠️',
    };
    return icons[type] || '🤖';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500',
      training: 'bg-yellow-500/10 text-yellow-500',
      retired: 'bg-gray-500/10 text-gray-500',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        title={t('Prediction Models', 'نماذج التنبؤ')}
        description={t('Manage AI prediction models', 'إدارة نماذج التنبؤ بالذكاء الاصطناعي')}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : models && models.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <Card key={model.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getModelIcon(model.model_type)}</span>
                    <div>
                      <CardTitle className="text-base">{model.model_name}</CardTitle>
                      <CardDescription className="text-xs">
                        v{model.model_version}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className={getStatusColor(model.status)}>
                      {model.status}
                    </Badge>
                    {model.is_active && (
                      <Badge variant="outline" className="text-xs">
                        {t('Active', 'نشط')}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('Accuracy', 'الدقة')}
                    </span>
                    <span className="font-medium">
                      {model.accuracy_score ? `${model.accuracy_score.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('Precision', 'الدقة')}
                    </span>
                    <span className="font-medium">
                      {model.precision_score ? `${model.precision_score.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('F1 Score', 'درجة F1')}
                    </span>
                    <span className="font-medium">
                      {model.f1_score ? `${model.f1_score.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                </div>

                {/* Statistics */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span>
                      {model.total_predictions} {t('predictions', 'تنبؤات')}
                    </span>
                  </div>
                  {model.last_trained_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {t('Trained', 'مُدرب')}: {format(new Date(model.last_trained_at), 'PP')}
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Model Info */}
                <div className="pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    {t('AI Model', 'نموذج الذكاء الاصطناعي')}: {model.ai_model_name}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('No models configured', 'لم يتم تكوين نماذج')}
            </h3>
            <p className="text-muted-foreground">
              {t('Initialize default models to get started', 'قم بتهيئة النماذج الافتراضية للبدء')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
