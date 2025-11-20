/**
 * M14 - KPI Alert Center
 * Advanced alert management with filters, severity, and real-time updates
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';
import { useKPIAlerts, useAcknowledgeAlert } from '../hooks/useUnifiedKPIs';
import { Skeleton } from '@/core/components/ui/skeleton';
import type { AlertSeverity } from '../types/unified-kpis.types';
import { toast } from 'sonner';
import { useAppContext } from '@/lib/app-context/AppContextProvider';

const severityConfig = {
  critical: { color: 'destructive', icon: AlertTriangle, label: 'حرج' },
  high: { color: 'destructive', icon: AlertTriangle, label: 'عالي' },
  medium: { color: 'default', icon: Clock, label: 'متوسط' },
  low: { color: 'secondary', icon: Clock, label: 'منخفض' }
} as const;

export function KPIAlertCenter() {
  const { user } = useAppContext();
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  
  const { data: alerts, isLoading } = useKPIAlerts({
    acknowledged: showAcknowledged,
    severity: severityFilter === 'all' ? undefined : [severityFilter]
  });

  const acknowledgeMutation = useAcknowledgeAlert();

  const handleAcknowledge = async (alertId: string) => {
    if (!user?.id) {
      toast.error('غير مصرح');
      return;
    }

    try {
      await acknowledgeMutation.mutateAsync(alertId);
      toast.success('تم اعتماد التنبيه بنجاح');
    } catch (error) {
      toast.error('فشل اعتماد التنبيه');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const filteredAlerts = alerts || [];
  const criticalCount = filteredAlerts.filter(a => a.severity === 'critical').length;
  const highCount = filteredAlerts.filter(a => a.severity === 'high').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            مركز التنبيهات
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} حرج</Badge>
            )}
            {highCount > 0 && (
              <Badge variant="destructive">{highCount} عالي</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as any)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="حسب الخطورة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="critical">حرج</SelectItem>
              <SelectItem value="high">عالي</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="low">منخفض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={showAcknowledged ? 'acknowledged' : 'active'} onValueChange={(v) => setShowAcknowledged(v === 'acknowledged')}>
          <TabsList className="w-full">
            <TabsTrigger value="active" className="flex-1">
              النشطة ({filteredAlerts.filter(a => !a.is_acknowledged).length})
            </TabsTrigger>
            <TabsTrigger value="acknowledged" className="flex-1">
              المعتمدة ({filteredAlerts.filter(a => a.is_acknowledged).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-4">
            {filteredAlerts.filter(a => !a.is_acknowledged).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
                <p>لا توجد تنبيهات نشطة</p>
              </div>
            ) : (
              filteredAlerts
                .filter(a => !a.is_acknowledged)
                .map(alert => {
                  const config = severityConfig[alert.severity];
                  const Icon = config.icon;
                  
                  return (
                    <Card key={alert.id} className="border-l-4" style={{
                      borderLeftColor: config.color === 'destructive' ? 'hsl(var(--destructive))' : 'hsl(var(--border))'
                    }}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="h-4 w-4" />
                              <Badge variant={config.color as any}>{config.label}</Badge>
                              <Badge variant="outline">{alert.module}</Badge>
                            </div>
                            <h4 className="font-semibold mb-1">{alert.kpi_name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>القيمة الحالية: <strong>{alert.current_value}</strong></span>
                              <span>الحد: <strong>{alert.threshold_value}</strong></span>
                              <span>{new Date(alert.created_at).toLocaleDateString('ar-SA')}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={acknowledgeMutation.isPending}
                          >
                            اعتماد
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </TabsContent>

          <TabsContent value="acknowledged" className="space-y-3 mt-4">
            {filteredAlerts.filter(a => a.is_acknowledged).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>لا توجد تنبيهات معتمدة</p>
              </div>
            ) : (
              filteredAlerts
                .filter(a => a.is_acknowledged)
                .map(alert => {
                  const config = severityConfig[alert.severity];
                  
                  return (
                    <Card key={alert.id} className="opacity-60">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{config.label}</Badge>
                              <Badge variant="outline">{alert.module}</Badge>
                              <CheckCircle className="h-4 w-4 text-success" />
                            </div>
                            <h4 className="font-semibold mb-1">{alert.kpi_name}</h4>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                            {alert.acknowledged_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                تم الاعتماد في {new Date(alert.acknowledged_at).toLocaleDateString('ar-SA')}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
