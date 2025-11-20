/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Component: TransactionLogViewer
 * Purpose: عارض سجلات التغييرات (Transaction Logs)
 * ============================================================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { 
  FileText, 
  Filter,
  RefreshCw,
  Eye,
  Database,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { getTransactionLogs, getTablesWithLogs, type TransactionLog } from '@/integrations/supabase/pitr';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export function TransactionLogViewer() {
  const { t, i18n } = useTranslation();

  const [filters, setFilters] = useState({
    tableName: '',
    operation: '',
    startDate: '',
    endDate: '',
  });

  const [selectedLog, setSelectedLog] = useState<TransactionLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch available tables
  const { data: tables } = useQuery({
    queryKey: ['tables-with-logs'],
    queryFn: getTablesWithLogs,
  });

  // Fetch transaction logs
  const { data: logs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['transaction-logs', filters],
    queryFn: () => getTransactionLogs({
      tableName: filters.tableName || undefined,
      operation: filters.operation || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      limit: 100,
    }),
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      tableName: '',
      operation: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleViewDetails = (log: TransactionLog) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('backup.transactionLog.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Table Filter */}
            <div className="space-y-2">
              <Label>{t('backup.transactionLog.table')}</Label>
              <Select
                value={filters.tableName}
                onValueChange={(value) => handleFilterChange('tableName', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('backup.transactionLog.allTables')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('backup.transactionLog.allTables')}</SelectItem>
                  {tables?.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operation Filter */}
            <div className="space-y-2">
              <Label>{t('backup.transactionLog.operation')}</Label>
              <Select
                value={filters.operation}
                onValueChange={(value) => handleFilterChange('operation', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('backup.transactionLog.allOperations')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('backup.transactionLog.allOperations')}</SelectItem>
                  <SelectItem value="INSERT">INSERT</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>{t('backup.transactionLog.startDate')}</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>{t('backup.transactionLog.endDate')}</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button onClick={handleClearFilters} variant="outline">
              {t('common.clear')}
            </Button>
            <Button onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {t('common.refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('backup.transactionLog.logs')}
          </CardTitle>
          <CardDescription>
            {t('backup.transactionLog.logsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('backup.transactionLog.operation')}</TableHead>
                    <TableHead>{t('backup.transactionLog.table')}</TableHead>
                    <TableHead>{t('backup.transactionLog.recordId')}</TableHead>
                    <TableHead>{t('backup.transactionLog.timestamp')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getOperationIcon(log.operation)}
                          <Badge className={getOperationColor(log.operation)}>
                            {log.operation}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{log.table_name}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{log.record_id}</code>
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.changed_at), 'PPP p', { 
                          locale: i18n.language === 'ar' ? ar : undefined 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleViewDetails(log)}
                          variant="ghost"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('backup.transactionLog.noLogs')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('backup.transactionLog.details')}</DialogTitle>
            <DialogDescription>
              {t('backup.transactionLog.detailsDescription')}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid gap-2 border rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{t('backup.transactionLog.operation')}:</span>
                  <Badge className={getOperationColor(selectedLog.operation)}>
                    {selectedLog.operation}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{t('backup.transactionLog.table')}:</span>
                  <code className="text-sm">{selectedLog.table_name}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{t('backup.transactionLog.recordId')}:</span>
                  <code className="text-sm">{selectedLog.record_id}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{t('backup.transactionLog.timestamp')}:</span>
                  <span className="text-sm">
                    {format(new Date(selectedLog.changed_at), 'PPP p', { 
                      locale: i18n.language === 'ar' ? ar : undefined 
                    })}
                  </span>
                </div>
              </div>

              {/* Old Data */}
              {selectedLog.old_data && (
                <div className="space-y-2">
                  <Label>{t('backup.transactionLog.oldData')}</Label>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* New Data */}
              {selectedLog.new_data && (
                <div className="space-y-2">
                  <Label>{t('backup.transactionLog.newData')}</Label>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
