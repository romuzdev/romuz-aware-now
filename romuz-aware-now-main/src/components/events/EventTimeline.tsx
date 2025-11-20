/**
 * Event Timeline Component
 * 
 * عرض الأحداث على شكل خط زمني
 */

import { useMemo } from 'react';
import type { SystemEvent } from '@/lib/events/event.types';
import { createEventTimeline } from '@/lib/events/utils/eventHistory';
import { Activity, Calendar } from 'lucide-react';

interface EventTimelineProps {
  events: SystemEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  const timeline = useMemo(() => {
    return createEventTimeline(events, 'day');
  }, [events]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-muted';
    }
  };

  if (timeline.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">لا توجد أحداث</h3>
        <p className="text-muted-foreground">
          لم يتم تسجيل أي أحداث في الخط الزمني
        </p>
      </div>
    );
  }

  return (
    <div className="h-[600px] overflow-y-auto">
      <div className="space-y-6">
        {timeline.map((item) => (
          <div key={item.date} className="relative">
            {/* Date Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {new Date(item.date).toLocaleDateString('ar-SA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                  {item.count} حدث
                </span>
              </div>
            </div>

            {/* Timeline Items */}
            <div className="relative border-r-2 border-muted pr-6 space-y-4">
              {item.events.map((event) => (
                <div key={event.id} className="relative">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -right-[9px] top-2 w-4 h-4 rounded-full border-2 border-background ${getPriorityColor(
                      event.priority
                    )}`}
                  />

                  {/* Event Card */}
                  <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{event.event_type}</span>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {event.source_module}
                          {event.entity_type && ` • ${event.entity_type}`}
                        </p>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            event.priority === 'critical' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-secondary text-secondary-foreground'
                          }`}>
                            {event.priority}
                          </span>
                          <span className="text-xs px-2 py-1 rounded border">
                            {event.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
