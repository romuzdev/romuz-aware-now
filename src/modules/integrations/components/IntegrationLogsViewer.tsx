/**
 * M15 - Integration Logs Viewer Component
 * View and filter integration logs
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Search, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function IntegrationLogsViewer() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Replace with real data from API
  const logs = [
    {
      id: '1',
      connector: 'Google Drive',
      level: 'info',
      message: 'Sync completed successfully',
      timestamp: new Date(Date.now() - 60000),
      details: { files: 45, duration: 123 },
    },
    {
      id: '2',
      connector: 'Microsoft Teams',
      level: 'warning',
      message: 'Rate limit approaching',
      timestamp: new Date(Date.now() - 120000),
      details: { remaining: 100, reset_in: 3600 },
    },
    {
      id: '3',
      connector: 'Slack',
      level: 'error',
      message: 'Failed to send notification',
      timestamp: new Date(Date.now() - 180000),
      details: { error: 'channel_not_found' },
    },
  ];

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return AlertCircle;
      case 'warning': return AlertCircle;
      case 'info': return Info;
      default: return CheckCircle2;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-destructive';
      case 'warning': return 'text-orange-500';
      case 'info': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const filteredLogs = logs.filter(log =>
    log.connector.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('logs.title', 'سجلات التكاملات')}</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('logs.search', 'ابحث في السجلات...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pe-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredLogs.map(log => {
            const Icon = getLevelIcon(log.level);
            
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <Icon className={cn('h-5 w-5 mt-0.5', getLevelColor(log.level))} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{log.connector}</span>
                    <Badge variant="outline" className="text-xs">
                      {t(`logs.level.${log.level}`, log.level)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{log.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.timestamp.toLocaleString('ar-SA')}
                  </p>
                  {Object.keys(log.details).length > 0 && (
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
