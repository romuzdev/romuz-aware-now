/**
 * Events List Live Component
 * 
 * قائمة الأحداث مع التحديثات المباشرة
 */

import { useEffect, useRef } from 'react';
import type { SystemEvent } from '@/lib/events/event.types';
import { Activity, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react';

interface EventsListLiveProps {
  events: SystemEvent[];
  isLoading?: boolean;
  onSelectEvent: (event: SystemEvent) => void;
  selectedEventId?: string;
}

export function EventsListLive({
  events,
  isLoading,
  onSelectEvent,
  selectedEventId,
}: EventsListLiveProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (scrollRef.current && events.length > 0) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <Info className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-500/5';
      case 'high':
        return 'border-orange-500 bg-orange-500/5';
      case 'medium':
        return 'border-blue-500 bg-blue-500/5';
      case 'low':
        return 'border-green-500 bg-green-500/5';
      default:
        return 'border-muted';
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { className: 'bg-orange-100 text-orange-800', label: 'قيد الانتظار' },
      processing: { className: 'bg-blue-100 text-blue-800', label: 'قيد المعالجة' },
      completed: { className: 'bg-green-100 text-green-800', label: 'مكتمل' },
      failed: { className: 'bg-red-100 text-red-800', label: 'فشل' },
    };

    const badge = config[status as keyof typeof config] || config.pending;
    return (
      <span className={`text-xs px-2 py-1 rounded ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      policy: 'bg-purple-100 text-purple-800',
      action: 'bg-blue-100 text-blue-800',
      kpi: 'bg-green-100 text-green-800',
      campaign: 'bg-orange-100 text-orange-800',
      training: 'bg-pink-100 text-pink-800',
      alert: 'bg-red-100 text-red-800',
      system: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[category] || colors.system}`}>
        {category}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">لا توجد أحداث</h3>
        <p className="text-muted-foreground">لم يتم تسجيل أي أحداث بعد</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] overflow-y-auto" ref={scrollRef}>
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => onSelectEvent(event)}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              getPriorityColor(event.priority)
            } ${
              selectedEventId === event.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                {getPriorityIcon(event.priority)}
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{event.event_type}</span>
                    {getCategoryBadge(event.event_category)}
                    {getStatusBadge(event.status)}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    المصدر: {event.source_module}
                    {event.entity_type && ` • ${event.entity_type}`}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(event.created_at).toLocaleString('ar-SA', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
