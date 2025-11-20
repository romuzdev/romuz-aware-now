/**
 * Integration Status Card Component
 * M15: Detailed status display for connectors
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Activity,
  Settings,
  Play,
  Pause,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { IntegrationConnector } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';

interface IntegrationStatusCardProps {
  connector: IntegrationConnector;
  onConfigure?: (connectorId: string) => void;
  onEnable?: (connectorId: string) => void;
  onDisable?: (connectorId: string) => void;
  onDelete?: (connectorId: string) => void;
  onSync?: (connectorId: string) => void;
}

const STATUS_CONFIG = {
  active: {
    icon: CheckCircle2,
    label: 'نشط',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    variant: 'default' as const,
  },
  inactive: {
    icon: Pause,
    label: 'معطل',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    variant: 'secondary' as const,
  },
  error: {
    icon: XCircle,
    label: 'خطأ',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    variant: 'destructive' as const,
  },
  testing: {
    icon: Clock,
    label: 'قيد الاختبار',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    variant: 'secondary' as const,
  },
};

const CONNECTOR_ICONS: Record<string, string> = {
  slack: '💬',
  teams: '👥',
  google_workspace: '📁',
  odoo: '🏢',
  webhook: '🔗',
  api: '🔌',
  custom: '⚙️',
};

export function IntegrationStatusCard({
  connector,
  onConfigure,
  onEnable,
  onDisable,
  onDelete,
  onSync,
}: IntegrationStatusCardProps) {
  const statusConfig = STATUS_CONFIG[connector.status];
  const StatusIcon = statusConfig.icon;
  const icon = CONNECTOR_ICONS[connector.type] || '⚙️';

  // Calculate sync health
  const now = new Date();
  const lastSync = connector.last_sync_at ? new Date(connector.last_sync_at) : null;
  const minutesSinceSync = lastSync 
    ? Math.floor((now.getTime() - lastSync.getTime()) / 60000)
    : null;
  
  const isOverdue = minutesSinceSync !== null && 
    minutesSinceSync > connector.sync_frequency_minutes * 1.5;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-md",
      connector.status === 'error' && "border-red-500/50",
      isOverdue && "border-yellow-500/50"
    )}>
      {/* Status Indicator Bar */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          connector.status === 'active' && "bg-green-500",
          connector.status === 'inactive' && "bg-gray-400",
          connector.status === 'error' && "bg-red-500",
          connector.status === 'testing' && "bg-yellow-500"
        )}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="text-4xl mt-1">{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg truncate">
                  {connector.name}
                </CardTitle>
                <Badge variant={statusConfig.variant} className="shrink-0">
                  <StatusIcon className="w-3 h-3 ml-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {connector.description || `تكامل ${connector.type}`}
              </CardDescription>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onConfigure && (
                <DropdownMenuItem onClick={() => onConfigure(connector.id)}>
                  <Settings className="w-4 h-4 ml-2" />
                  إعدادات
                </DropdownMenuItem>
              )}
              
              {onSync && connector.status === 'active' && (
                <DropdownMenuItem onClick={() => onSync(connector.id)}>
                  <Activity className="w-4 h-4 ml-2" />
                  مزامنة الآن
                </DropdownMenuItem>
              )}

              {connector.status === 'active' && onDisable && (
                <DropdownMenuItem onClick={() => onDisable(connector.id)}>
                  <Pause className="w-4 h-4 ml-2" />
                  تعطيل
                </DropdownMenuItem>
              )}

              {connector.status === 'inactive' && onEnable && (
                <DropdownMenuItem onClick={() => onEnable(connector.id)}>
                  <Play className="w-4 h-4 ml-2" />
                  تفعيل
                </DropdownMenuItem>
              )}

              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(connector.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sync Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">آخر مزامنة:</span>
            <div className="flex items-center gap-2">
              {lastSync ? (
                <>
                  <span className={cn(
                    "font-medium",
                    isOverdue && "text-yellow-600"
                  )}>
                    {format(lastSync, 'dd MMM yyyy HH:mm', { locale: ar })}
                  </span>
                  {isOverdue && (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">لم تتم بعد</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">تكرار المزامنة:</span>
            <span className="font-medium">
              كل {connector.sync_frequency_minutes} دقيقة
            </span>
          </div>
        </div>

        {/* Sync Progress (if syncing) */}
        {connector.status === 'testing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">جاري الاختبار...</span>
              <span className="text-muted-foreground">45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>
        )}

        {/* Error Message */}
        {connector.status === 'error' && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-600">
                  فشل الاتصال
                </p>
                <p className="text-xs text-red-600/80 mt-1">
                  يرجى التحقق من بيانات الاتصال والمحاولة مرة أخرى
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {onConfigure && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onConfigure(connector.id)}
              className="flex-1"
            >
              <Settings className="w-4 h-4 ml-2" />
              إعدادات
            </Button>
          )}
          
          {onSync && connector.status === 'active' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onSync(connector.id)}
              className="flex-1"
            >
              <Activity className="w-4 h-4 ml-2" />
              مزامنة
            </Button>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground">
          <p>تم الإنشاء: {format(new Date(connector.created_at), 'dd MMM yyyy', { locale: ar })}</p>
        </div>
      </CardContent>
    </Card>
  );
}
