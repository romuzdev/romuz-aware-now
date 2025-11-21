/**
 * Predictive Analytics - Predictions List
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/ui/page-header';
import { Brain, Filter, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { usePredictions } from '@/modules/analytics/hooks/usePredictiveAnalytics';
import { format } from 'date-fns';
import { CreatePredictionDialog } from '../components/CreatePredictionDialog';
import type { PredictionType, ValidationStatus } from '@/modules/analytics/types/predictive-analytics.types';

export default function Predictions() {
  const { t } = useTranslation();
  const { tenantId } = useAppContext();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filters: any = {};
  if (filterType !== 'all') {
    filters.prediction_type = [filterType as PredictionType];
  }
  if (filterStatus !== 'all') {
    filters.validation_status = [filterStatus as ValidationStatus];
  }

  const { data: predictions, isLoading } = usePredictions(tenantId || '', filters);

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      critical: 'bg-destructive/10 text-destructive border-destructive/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    return colors[category || ''] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const getValidationStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      validated: 'bg-green-500/10 text-green-500',
      pending: 'bg-yellow-500/10 text-yellow-500',
      incorrect: 'bg-red-500/10 text-red-500',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Brain}
        title={t('Predictions', 'التنبؤات')}
        description={t('View and manage all predictions', 'عرض وإدارة جميع التنبؤات')}
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            {t('New Prediction', 'تنبؤ جديد')}
          </Button>
        }
      />

      <CreatePredictionDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-base">{t('Filters', 'الفلاتر')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('Prediction Type', 'نوع التنبؤ')}
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Types', 'كل الأنواع')}</SelectItem>
                  <SelectItem value="risk">{t('Risk', 'المخاطر')}</SelectItem>
                  <SelectItem value="incident">{t('Incident', 'الحوادث')}</SelectItem>
                  <SelectItem value="compliance">{t('Compliance', 'الامتثال')}</SelectItem>
                  <SelectItem value="campaign">{t('Campaign', 'الحملات')}</SelectItem>
                  <SelectItem value="audit">{t('Audit', 'التدقيق')}</SelectItem>
                  <SelectItem value="breach">{t('Breach', 'الاختراق')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('Validation Status', 'حالة التحقق')}
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Status', 'كل الحالات')}</SelectItem>
                  <SelectItem value="pending">{t('Pending', 'قيد الانتظار')}</SelectItem>
                  <SelectItem value="validated">{t('Validated', 'متحقق منها')}</SelectItem>
                  <SelectItem value="incorrect">{t('Incorrect', 'غير صحيحة')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictions List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('All Predictions', 'جميع التنبؤات')}</CardTitle>
          <CardDescription>
            {predictions?.length || 0} {t('predictions found', 'تنبؤ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : predictions && predictions.length > 0 ? (
            <div className="space-y-4">
              {predictions.map((prediction) => (
                <Card key={prediction.id} className="border-l-4" style={{
                  borderLeftColor: prediction.predicted_category === 'critical' ? 'hsl(var(--destructive))' :
                    prediction.predicted_category === 'high' ? 'hsl(25, 95%, 53%)' :
                    prediction.predicted_category === 'medium' ? 'hsl(48, 96%, 53%)' :
                    'hsl(142, 76%, 36%)'
                }}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-lg capitalize">
                            {prediction.prediction_type}
                          </span>
                          <Badge className={getCategoryColor(prediction.predicted_category)}>
                            {prediction.predicted_category}
                          </Badge>
                          <Badge variant="outline" className={getValidationStatusColor(prediction.validation_status)}>
                            {prediction.validation_status}
                          </Badge>
                        </div>
                        {prediction.entity_type && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {t('Entity', 'الكيان')}: {prediction.entity_type}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {prediction.ai_reasoning}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-3xl font-bold mb-1">
                          {prediction.predicted_value?.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {t('Confidence', 'الثقة')}: {prediction.confidence_score?.toFixed(0)}%
                        </div>
                        {prediction.prediction_range_min !== null && prediction.prediction_range_max !== null && (
                          <div className="text-xs text-muted-foreground">
                            {t('Range', 'النطاق')}: {prediction.prediction_range_min.toFixed(0)}-{prediction.prediction_range_max.toFixed(0)}
                          </div>
                        )}
                      </div>
                    </div>

                    {prediction.validation_status === 'validated' && prediction.actual_value !== null && (
                      <div className="flex items-center gap-4 p-3 bg-muted rounded-lg text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('Actual', 'الفعلي')}: </span>
                          <span className="font-semibold">{prediction.actual_value.toFixed(0)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('Error', 'الخطأ')}: </span>
                          <span className="font-semibold">
                            {prediction.prediction_error?.toFixed(1) || 0}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>{t('Model', 'النموذج')}: {prediction.ai_model_used}</span>
                        <span>{prediction.ai_tokens_used} {t('tokens', 'رموز')}</span>
                        <span>{prediction.processing_time_ms}ms</span>
                      </div>
                      <span>{format(new Date(prediction.created_at), 'PPp')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4" />
              <p>{t('No predictions found', 'لم يتم العثور على تنبؤات')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
