/**
 * Integration Logs Component
 * Gate-M15: View integration events and logs
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { CheckCircle, XCircle, Clock, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { fetchTenantLogs, getLogStatistics } from '../integration';
import type { IntegrationLog } from '../types';

export function IntegrationLogs() {
  const { t } = useTranslation();
  const { tenantId } = useAppContext();
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    pending: 0,
  });

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [tenantId]);

  const loadLogs = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const data = await fetchTenantLogs(tenantId, 100);
      setLogs(data);
    } catch (error: any) {
      toast.error('فشل تحميل السجلات', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!tenantId) return;
    
    try {
      const data = await getLogStatistics(tenantId);
      setStats(data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'retrying':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      success: { variant: 'default', label: 'نجح' },
      failed: { variant: 'destructive', label: 'فشل' },
      pending: { variant: 'secondary', label: 'قيد الانتظار' },
      retrying: { variant: 'outline', label: 'إعادة المحاولة' },
    };
    
    const config = variants[status] || { variant: 'secondary', label: status };
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.status === filter);

  if (!tenantId) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">لم يتم العثور على معرف الجهة</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">سجلات التكاملات</h2>
          <p className="text-muted-foreground">
            متابعة الأحداث والعمليات
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="success">نجح</SelectItem>
              <SelectItem value="failed">فشل</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">نجح</p>
              <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">فشل</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">قيد الانتظار</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">لا توجد سجلات</p>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{log.event_type}</h4>
                        {getStatusBadge(log.status)}
                        {log.event_category && (
                          <Badge variant="outline" className="text-xs">
                            {log.event_category}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('ar')}
                      </p>

                      {log.error_message && (
                        <p className="text-sm text-destructive mt-2">
                          {log.error_message}
                        </p>
                      )}

                      {log.duration_ms && (
                        <p className="text-xs text-muted-foreground mt-1">
                          المدة: {log.duration_ms}ms
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
