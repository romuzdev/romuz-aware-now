/**
 * Security Event Card Component
 * M18.5 - SecOps Integration
 */

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import type { SecurityEvent } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SecurityEventCardProps {
  event: SecurityEvent;
  onProcess?: (id: string) => void;
  onView?: (id: string) => void;
}

const severityConfig = {
  critical: { color: 'bg-destructive text-destructive-foreground', icon: AlertTriangle, label: 'حرج' },
  high: { color: 'bg-orange-500 text-white', icon: AlertTriangle, label: 'عالي' },
  medium: { color: 'bg-yellow-500 text-white', icon: Clock, label: 'متوسط' },
  low: { color: 'bg-blue-500 text-white', icon: Clock, label: 'منخفض' },
  info: { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'معلوماتي' },
};

export function SecurityEventCard({ event, onProcess, onView }: SecurityEventCardProps) {
  const config = severityConfig[event.severity as keyof typeof severityConfig];
  const Icon = config.icon;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{event.event_type}</h3>
              <Badge variant="outline" className="text-xs">
                {event.source_system}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {event.event_data && typeof event.event_data === 'object' && 'description' in event.event_data 
                ? String((event.event_data as any).description)
                : 'لا يوجد وصف'}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{format(new Date(event.event_timestamp), 'PPp', { locale: ar })}</span>
              {event.source_ip && <span>IP: {event.source_ip}</span>}
              {event.event_data && typeof event.event_data === 'object' && 'target_asset' in event.event_data && (
                <span>الأصل: {String((event.event_data as any).target_asset)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {event.is_processed ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              معالج
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onProcess?.(event.id)}
            >
              معالجة
            </Button>
          )}
          
          {onView && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onView(event.id)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {event.event_data && typeof event.event_data === 'object' && 'tags' in event.event_data && 
       Array.isArray((event.event_data as any).tags) && (
        <div className="flex gap-1 mt-3 flex-wrap">
          {((event.event_data as any).tags as string[]).map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
