/**
 * M19: Prediction Alerts UI Component
 * Display and manage prediction-based alerts
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { AlertTriangle, Bell, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { usePredictionAlerts, useAcknowledgeAlert } from '@/modules/predictive-analytics/hooks';

export function PredictionAlertsUI() {
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'high'>('all');
  
  const { data: allAlerts, isLoading } = usePredictionAlerts();
  const { data: criticalAlerts } = usePredictionAlerts({ severity: 'critical' });
  const { data: highAlerts } = usePredictionAlerts({ severity: 'high' });
  
  const acknowledgeMutation = useAcknowledgeAlert();

  const handleAcknowledge = (alertId: string) => {
    acknowledgeMutation.mutate(alertId);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <TrendingUp className="h-4 w-4 text-warning" />;
      case 'medium':
        return <Bell className="h-4 w-4 text-info" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const renderAlerts = (alerts: any[] | undefined) => {
    if (!alerts || alerts.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-12">
          لا توجد تنبيهات حالياً
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-3 flex-1">
                  <div className="mt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{alert.alert_title_ar}</h4>
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity === 'critical' && 'حرجة'}
                        {alert.severity === 'high' && 'عالية'}
                        {alert.severity === 'medium' && 'متوسطة'}
                        {alert.severity === 'low' && 'منخفضة'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.alert_message_ar}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {new Date(alert.created_at).toLocaleString('ar-SA')}
                      </span>
                      {alert.context_type && (
                        <Badge variant="outline" className="text-xs">
                          {alert.context_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {alert.status === 'pending' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledgeMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 ml-2" />
                      إقرار
                    </Button>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      تم الإقرار
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          تنبيهات التنبؤات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              الكل ({allAlerts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="critical">
              حرجة ({criticalAlerts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="high">
              عالية ({highAlerts?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {renderAlerts(allAlerts)}
          </TabsContent>

          <TabsContent value="critical" className="mt-6">
            {renderAlerts(criticalAlerts)}
          </TabsContent>

          <TabsContent value="high" className="mt-6">
            {renderAlerts(highAlerts)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
