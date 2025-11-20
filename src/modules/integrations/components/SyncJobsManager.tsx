/**
 * Sync Jobs Manager Component
 * Gate-M15: Manage and monitor sync jobs
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Play, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useSyncJobHistory, useTriggerSync, useUpdateSyncFrequency } from '../hooks/useSyncJobs';
import { useQuery } from '@tanstack/react-query';
import { fetchConnectors } from '../integration/connectors.integration';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

export function SyncJobsManager() {
  const { tenantId } = useAppContext();
  const [selectedConnector, setSelectedConnector] = useState<string>('all');
  
  const { data: connectors = [] } = useQuery({
    queryKey: ['connectors', tenantId],
    queryFn: () => fetchConnectors(tenantId!),
    enabled: !!tenantId,
  });

  const { data: syncHistory = [], refetch, isLoading } = useSyncJobHistory(
    selectedConnector === 'all' ? undefined : selectedConnector,
    50
  );

  const triggerSync = useTriggerSync();
  const updateFrequency = useUpdateSyncFrequency();

  const handleManualSync = async (connectorId: string) => {
    try {
      await triggerSync.mutateAsync({ connectorId });
      toast.success('تم تشغيل المزامنة بنجاح');
      refetch();
    } catch (error) {
      toast.error('فشل تشغيل المزامنة');
      console.error('Sync failed:', error);
    }
  };

  const handleUpdateFrequency = async (connectorId: string, frequencyMinutes: number) => {
    try {
      await updateFrequency.mutateAsync({ connectorId, frequencyMinutes });
      toast.success('تم تحديث تكرار المزامنة');
    } catch (error) {
      toast.error('فشل تحديث التكرار');
    }
  };

  const syncableConnectors = connectors.filter(c => 
    ['google_workspace', 'odoo', 'teams'].includes(c.type)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-success">نجح</Badge>;
      case 'failed':
        return <Badge variant="destructive">فشل</Badge>;
      case 'pending':
        return <Badge variant="secondary">قيد التنفيذ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Connectors - Manual Sync */}
      <Card>
        <CardHeader>
          <CardTitle>التحكم بالمزامنة</CardTitle>
        </CardHeader>
        <CardContent>
          {syncableConnectors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد تكاملات تدعم المزامنة
            </div>
          ) : (
            <div className="space-y-4">
              {syncableConnectors.map(connector => (
                <div key={connector.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-semibold">{connector.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {connector.type} · تكرار المزامنة: كل {connector.sync_frequency_minutes || 60} دقيقة
                    </div>
                    {connector.last_sync_at && (
                      <div className="text-xs text-muted-foreground">
                        آخر مزامنة: {formatDistanceToNow(new Date(connector.last_sync_at), { 
                          addSuffix: true, 
                          locale: ar 
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={String(connector.sync_frequency_minutes || 60)}
                      onValueChange={(value) => handleUpdateFrequency(connector.id, Number(value))}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="التكرار" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">كل 15 دقيقة</SelectItem>
                        <SelectItem value="30">كل 30 دقيقة</SelectItem>
                        <SelectItem value="60">كل ساعة</SelectItem>
                        <SelectItem value="180">كل 3 ساعات</SelectItem>
                        <SelectItem value="360">كل 6 ساعات</SelectItem>
                        <SelectItem value="1440">يومياً</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => handleManualSync(connector.id)}
                      disabled={triggerSync.isPending}
                      size="sm"
                    >
                      <Play className="w-4 h-4 ml-2" />
                      تشغيل الآن
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>سجل المزامنة</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedConnector} onValueChange={setSelectedConnector}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="اختر التكامل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التكاملات</SelectItem>
                  {syncableConnectors.map(connector => (
                    <SelectItem key={connector.id} value={connector.id}>
                      {connector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
        </CardHeader>
        <CardContent>
          {syncHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد سجل مزامنة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التكامل</TableHead>
                  <TableHead>الرسالة</TableHead>
                  <TableHead>الوقت</TableHead>
                  <TableHead>المدة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncHistory.map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        {getStatusBadge(job.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {connectors.find(c => c.id === job.connector_id)?.name || 'غير معروف'}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {job.message}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(job.created_at), { 
                        addSuffix: true, 
                        locale: ar 
                      })}
                    </TableCell>
                    <TableCell>
                      {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(2)}s` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
