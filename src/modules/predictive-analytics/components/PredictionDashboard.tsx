/**
 * M19: Prediction Dashboard Component
 * Overview of all prediction models and their performance
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Brain, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePredictionModels } from '../hooks/usePredictiveModels';
import { usePredictionAlerts } from '../hooks/usePredictionAlerts';
import { cn } from '@/lib/utils';

const MODEL_TYPES = {
  'risk_forecasting': { nameAr: 'توقع المخاطر', icon: TrendingUp, color: 'text-red-500' },
  'incident_prediction': { nameAr: 'توقع الحوادث', icon: AlertTriangle, color: 'text-orange-500' },
  'compliance_drift': { nameAr: 'انحراف الامتثال', icon: CheckCircle2, color: 'text-blue-500' },
  'campaign_effectiveness': { nameAr: 'فعالية الحملات', icon: TrendingUp, color: 'text-green-500' },
};

export function PredictionDashboard() {
  const { data: models, isLoading: modelsLoading } = usePredictionModels({ isActive: true });
  const { data: alerts, isLoading: alertsLoading } = usePredictionAlerts({ status: 'active' });

  const activeAlerts = alerts?.filter(a => a.status === 'active') || [];
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  if (modelsLoading || alertsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const modelsByType = models?.reduce((acc, model) => {
    if (!acc[model.model_type]) acc[model.model_type] = [];
    acc[model.model_type].push(model);
    return acc;
  }, {} as Record<string, typeof models>) || {};

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">النماذج النشطة</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{models?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              نماذج ذكاء اصطناعي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">التنبيهات النشطة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {criticalAlerts.length} حرجة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">متوسط الدقة</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {models && models.length > 0
                ? Math.round((models.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / models.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              عبر جميع النماذج
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">التنبؤات اليوم</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {models?.reduce((sum, m) => sum + (m.total_predictions || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              تنبؤ مكتمل
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Models by Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(MODEL_TYPES).map(([type, config]) => {
          const typeModels = modelsByType[type] || [];
          const ModelIcon = config.icon;

          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ModelIcon className={cn('h-5 w-5', config.color)} />
                  <span className="text-sm">{config.nameAr}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{typeModels.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {typeModels.filter(m => m.is_active).length} نشط
                  </p>
                  
                  {typeModels.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">متوسط الدقة</div>
                      <div className="text-lg font-semibold">
                        {Math.round((typeModels.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / typeModels.length) * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              تنبيهات حرجة ({criticalAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{alert.title_ar}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {alert.description_ar}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    عرض
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
