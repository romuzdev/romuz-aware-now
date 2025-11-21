/**
 * M15 - Connector Card Component
 * Display integration connector with status and actions
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Settings, Play, Pause, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectorCardProps {
  integration: {
    id: string;
    name: string;
    description: string;
    icon: string;
    status: 'available' | 'configured' | 'active' | 'error';
    category: string;
  };
}

export function ConnectorCard({ integration }: ConnectorCardProps) {
  const { t } = useTranslation();

  const statusConfig = {
    available: {
      label: t('status.available', 'متاح'),
      variant: 'secondary' as const,
      color: 'text-muted-foreground',
    },
    configured: {
      label: t('status.configured', 'مُعد'),
      variant: 'outline' as const,
      color: 'text-primary',
    },
    active: {
      label: t('status.active', 'نشط'),
      variant: 'default' as const,
      color: 'text-green-500',
    },
    error: {
      label: t('status.error', 'خطأ'),
      variant: 'destructive' as const,
      color: 'text-destructive',
    },
  };

  const config = statusConfig[integration.status];

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{integration.icon}</div>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {t(`category.${integration.category}`, integration.category)}
              </p>
            </div>
          </div>
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {integration.description}
        </p>

        <div className="flex items-center gap-2">
          {integration.status === 'available' ? (
            <Button className="w-full" size="sm">
              {t('integrations.configure', 'إعداد التكامل')}
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="flex-1">
                <Settings className="h-4 w-4 me-2" />
                {t('common.settings', 'إعدادات')}
              </Button>
              {integration.status === 'active' ? (
                <Button variant="outline" size="sm">
                  <Pause className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
