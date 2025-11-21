/**
 * SecOps Connector Card Component
 * M18.5 - SecOps Integration
 */

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { RefreshCw, Settings, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { SecOpsConnector } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ConnectorCardProps {
  connector: SecOpsConnector;
  onSync?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusConfig = {
  active: { color: 'bg-green-500', icon: CheckCircle, label: 'نشط' },
  error: { color: 'bg-destructive', icon: XCircle, label: 'خطأ' },
  syncing: { color: 'bg-blue-500', icon: RefreshCw, label: 'مزامنة' },
  idle: { color: 'bg-muted', icon: Clock, label: 'خامل' },
};

export function ConnectorCard({ connector, onSync, onEdit, onDelete }: ConnectorCardProps) {
  const config = statusConfig[connector.sync_status as keyof typeof statusConfig] || statusConfig.idle;
  const StatusIcon = config.icon;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${config.color} text-white`}>
            <StatusIcon className="h-4 w-4" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{connector.name_ar}</h3>
              <Badge variant="outline">{connector.connector_type}</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {connector.connection_config && typeof connector.connection_config === 'object' && 'url' in connector.connection_config
                ? String((connector.connection_config as any).url)
                : 'لا يوجد URL'}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          {onSync && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSync(connector.id)}
              disabled={connector.sync_status === 'syncing'}
            >
              <RefreshCw className={`h-4 w-4 ${connector.sync_status === 'syncing' ? 'animate-spin' : ''}`} />
            </Button>
          )}
          
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(connector.id)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(connector.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg text-sm">
        <div>
          <p className="text-xs text-muted-foreground">آخر مزامنة</p>
          <p className="font-medium">
            {connector.last_sync_at
              ? format(new Date(connector.last_sync_at), 'PPp', { locale: ar })
              : 'لم تتم بعد'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">الحالة</p>
          <Badge variant={connector.sync_status === 'success' ? 'default' : 'secondary'}>
            {config.label}
          </Badge>
        </div>
      </div>

      {connector.last_error && (
        <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
          خطأ: {connector.last_error}
        </div>
      )}
    </Card>
  );
}
