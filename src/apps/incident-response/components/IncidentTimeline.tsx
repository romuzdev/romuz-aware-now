/**
 * M18: Incident Response System - Timeline Component
 * Visual timeline display for incident events
 */

import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  FileText,
  UserPlus,
  ArrowUpCircle,
  MessageSquare,
  Settings,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent } from '@/core/components/ui/card';

interface TimelineEvent {
  id: string;
  timestamp: string;
  event_type: string;
  action_ar: string;
  action_en?: string;
  actor_id?: string;
  old_value?: string;
  new_value?: string;
  details?: Record<string, any>;
  evidence_urls?: string[];
  is_system_generated?: boolean;
}

interface IncidentTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

/**
 * Get icon for event type
 */
function getEventIcon(eventType: string) {
  const iconMap: Record<string, React.ReactNode> = {
    reported: <AlertCircle className="h-4 w-4" />,
    detected: <Activity className="h-4 w-4" />,
    auto_detected: <Activity className="h-4 w-4" />,
    acknowledged: <CheckCircle className="h-4 w-4" />,
    assigned: <UserPlus className="h-4 w-4" />,
    status_changed: <Settings className="h-4 w-4" />,
    note_added: <MessageSquare className="h-4 w-4" />,
    escalated: <ArrowUpCircle className="h-4 w-4" />,
    closed: <XCircle className="h-4 w-4" />,
    resolved: <CheckCircle className="h-4 w-4" />,
    evidence_added: <FileText className="h-4 w-4" />,
    notification_sent: <MessageSquare className="h-4 w-4" />,
  };

  return iconMap[eventType] || <Clock className="h-4 w-4" />;
}

/**
 * Get color for event type
 */
function getEventColor(eventType: string): string {
  const colorMap: Record<string, string> = {
    reported: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    detected: 'text-blue-600 bg-blue-50 border-blue-200',
    auto_detected: 'text-blue-600 bg-blue-50 border-blue-200',
    acknowledged: 'text-green-600 bg-green-50 border-green-200',
    assigned: 'text-purple-600 bg-purple-50 border-purple-200',
    status_changed: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    note_added: 'text-gray-600 bg-gray-50 border-gray-200',
    escalated: 'text-orange-600 bg-orange-50 border-orange-200',
    closed: 'text-gray-600 bg-gray-50 border-gray-200',
    resolved: 'text-green-600 bg-green-50 border-green-200',
    evidence_added: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    notification_sent: 'text-blue-600 bg-blue-50 border-blue-200',
  };

  return colorMap[eventType] || 'text-gray-600 bg-gray-50 border-gray-200';
}

/**
 * Format timestamp in Arabic
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return format(date, 'dd MMMM yyyy - HH:mm', { locale: ar });
  } catch {
    return timestamp;
  }
}

/**
 * Timeline component
 */
export function IncidentTimeline({ events, className }: IncidentTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">لا توجد أحداث في الخط الزمني</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const isSystemGenerated = event.is_system_generated;
        const eventColor = getEventColor(event.event_type);

        return (
          <div key={event.id} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div 
                className="absolute right-[1.875rem] top-12 h-full w-0.5 bg-border"
                style={{ height: 'calc(100% + 1rem)' }}
              />
            )}

            {/* Timeline item */}
            <Card className="relative">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div 
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
                      eventColor
                    )}
                  >
                    {getEventIcon(event.event_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <p className="text-base font-semibold leading-tight">
                          {event.action_ar}
                        </p>
                        {event.action_en && (
                          <p className="text-sm text-muted-foreground">
                            {event.action_en}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="text-left text-sm text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(event.timestamp)}
                      </div>
                    </div>

                    {/* Actor badge */}
                    {!isSystemGenerated && event.actor_id && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {event.actor_id}
                        </Badge>
                      </div>
                    )}

                    {isSystemGenerated && (
                      <Badge variant="secondary" className="text-xs">
                        نظام تلقائي
                      </Badge>
                    )}

                    {/* Value changes */}
                    {(event.old_value || event.new_value) && (
                      <div className="flex items-center gap-2 text-sm">
                        {event.old_value && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {event.old_value}
                            </Badge>
                            <span className="text-muted-foreground">←</span>
                          </>
                        )}
                        {event.new_value && (
                          <Badge variant="default" className="text-xs">
                            {event.new_value}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Details */}
                    {event.details && Object.keys(event.details).length > 0 && (
                      <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                        {Object.entries(event.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-2">
                            <span className="font-medium text-muted-foreground">
                              {key}:
                            </span>
                            <span className="text-foreground">
                              {typeof value === 'object' 
                                ? JSON.stringify(value) 
                                : String(value)
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Evidence URLs */}
                    {event.evidence_urls && event.evidence_urls.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          الأدلة المرفقة:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {event.evidence_urls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <FileText className="h-3 w-3" />
                              دليل {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
