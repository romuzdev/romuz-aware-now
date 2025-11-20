/**
 * Integration Health Monitor Component
 * Gate-M15: Real-time connector health monitoring
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink 
} from 'lucide-react';
import { useIntegrationHealth, useIntegrationHealthSummary, useTestConnectorConnection } from '../hooks/useIntegrationHealth';
import { useConnectorErrors } from '../hooks/useIntegrationHealth';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface IntegrationHealthMonitorProps {
  onViewDetails?: (connectorId: string) => void;
}

export function IntegrationHealthMonitor({ onViewDetails }: IntegrationHealthMonitorProps) {
  const { data: healthData = [], isLoading, refetch } = useIntegrationHealth();
  const { data: summary } = useIntegrationHealthSummary();
  const testConnection = useTestConnectorConnection();

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-success">سليم</Badge>;
      case 'warning':
        return <Badge variant="default" className="bg-warning text-warning-foreground">تحذير</Badge>;
      case 'error':
        return <Badge variant="destructive">خطأ</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  const handleTestConnection = async (connectorId: string) => {
    try {
      await testConnection.mutateAsync(connectorId);
      refetch();
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">الإجمالي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-success">سليم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{summary.healthy}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-warning">تحذير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{summary.warning}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-destructive">خطأ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{summary.error}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health Status List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>حالة التكاملات</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {healthData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد تكاملات مثبتة حالياً
            </div>
          ) : (
            <div className="space-y-4">
              {healthData.map(connector => (
                <ConnectorHealthCard
                  key={connector.connectorId}
                  connector={connector}
                  onTest={handleTestConnection}
                  onViewDetails={onViewDetails}
                  isTesting={testConnection.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ConnectorHealthCardProps {
  connector: any;
  onTest: (connectorId: string) => void;
  onViewDetails?: (connectorId: string) => void;
  isTesting: boolean;
}

function ConnectorHealthCard({ connector, onTest, onViewDetails, isTesting }: ConnectorHealthCardProps) {
  const { data: errors = [] } = useConnectorErrors(connector.connectorId, 5);

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-success">سليم</Badge>;
      case 'warning':
        return <Badge variant="default" className="bg-warning text-warning-foreground">تحذير</Badge>;
      case 'error':
        return <Badge variant="destructive">خطأ</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getHealthIcon(connector.healthStatus)}
          <div>
            <div className="font-semibold">{connector.connectorName}</div>
            <div className="text-sm text-muted-foreground">
              {connector.connectorType}
              {connector.lastSyncAt && (
                <> · آخر مزامنة {formatDistanceToNow(new Date(connector.lastSyncAt), { addSuffix: true, locale: ar })}</>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getHealthBadge(connector.healthStatus)}
          <Badge variant={connector.status === 'active' ? 'default' : 'secondary'}>
            {connector.status === 'active' ? 'نشط' : 'متوقف'}
          </Badge>
        </div>
      </div>

      {connector.errorCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {connector.errorCount} خطأ في آخر 24 ساعة
          </AlertDescription>
        </Alert>
      )}

      {errors.length > 0 && (
        <div className="text-sm space-y-1">
          <div className="font-medium text-muted-foreground">آخر الأخطاء:</div>
          {errors.slice(0, 2).map((error: any, index: number) => (
            <div key={index} className="text-destructive text-xs">
              • {error.message}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTest(connector.connectorId)}
          disabled={isTesting}
        >
          <RefreshCw className={`w-4 h-4 ml-2 ${isTesting ? 'animate-spin' : ''}`} />
          اختبار الاتصال
        </Button>
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(connector.connectorId)}
          >
            <ExternalLink className="w-4 h-4 ml-2" />
            التفاصيل
          </Button>
        )}
      </div>
    </div>
  );
}
