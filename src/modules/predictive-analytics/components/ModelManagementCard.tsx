/**
 * M19: Model Management Card Component
 * Display and manage individual prediction models
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import { Brain, TrendingUp, Calendar, Activity } from 'lucide-react';
import { useModelAccuracyMetrics } from '@/modules/predictive-analytics/hooks';

interface ModelManagementCardProps {
  model: {
    id: string;
    model_name_ar: string;
    model_type: string;
    version: string;
    accuracy_score?: number;
    is_active: boolean;
    last_trained_at?: string;
    created_at: string;
  };
  onTrain?: (modelId: string) => void;
  onToggleActive?: (modelId: string, isActive: boolean) => void;
}

export function ModelManagementCard({
  model,
  onTrain,
  onToggleActive,
}: ModelManagementCardProps) {
  const { data: metrics } = useModelAccuracyMetrics(model.id);

  const getModelTypeLabel = (type: string) => {
    switch (type) {
      case 'risk_forecasting':
        return 'توقع المخاطر';
      case 'incident_prediction':
        return 'توقع الحوادث';
      case 'compliance_drift':
        return 'انحراف الامتثال';
      case 'campaign_effectiveness':
        return 'فعالية الحملات';
      default:
        return type;
    }
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return 'text-muted-foreground';
    if (accuracy >= 90) return 'text-success';
    if (accuracy >= 70) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{model.model_name_ar}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {getModelTypeLabel(model.model_type)} • {model.version}
              </p>
            </div>
          </div>
          <Badge variant={model.is_active ? 'default' : 'outline'}>
            {model.is_active ? 'نشط' : 'غير نشط'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Accuracy Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">دقة النموذج</span>
            <span className={`font-semibold ${getAccuracyColor(model.accuracy_score)}`}>
              {model.accuracy_score ? `${model.accuracy_score.toFixed(1)}%` : 'غير متوفر'}
            </span>
          </div>
          <Progress 
            value={model.accuracy_score || 0} 
            className="h-2"
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">التنبؤات</span>
            </div>
            <p className="text-lg font-semibold">
              {metrics?.totalPredictions || 0}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-xs">متوسط الدقة</span>
            </div>
            <p className="text-lg font-semibold">
              {metrics?.avgAccuracy ? `${metrics.avgAccuracy.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Last Trained */}
        {model.last_trained_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="h-3 w-3" />
            <span>
              آخر تدريب: {new Date(model.last_trained_at).toLocaleDateString('ar-SA')}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onTrain && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTrain(model.id)}
              className="flex-1"
            >
              إعادة التدريب
            </Button>
          )}
          {onToggleActive && (
            <Button
              size="sm"
              variant={model.is_active ? 'outline' : 'default'}
              onClick={() => onToggleActive(model.id, !model.is_active)}
              className="flex-1"
            >
              {model.is_active ? 'تعطيل' : 'تفعيل'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
