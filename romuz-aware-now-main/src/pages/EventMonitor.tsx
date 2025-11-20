/**
 * Event Monitor Dashboard Page
 * 
 * لوحة مراقبة الأحداث في الوقت الفعلي
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { EventsListLive, EventStatistics, EventFilters, EventTimeline } from '@/components/events';
import type { SystemEvent } from '@/lib/events/event.types';
import type { EventFilterCriteria } from '@/lib/events/utils/eventFilters';
import { listSystemEvents } from '@/integrations/supabase/events';

export default function EventMonitor() {
  const [filters, setFilters] = useState<EventFilterCriteria>({});
  const [selectedEvent, setSelectedEvent] = useState<SystemEvent | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  // Fetch events with filters using integration layer
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['system-events', filters],
    queryFn: () => listSystemEvents({
      category: filters.category,
      priority: filters.priority,
      eventType: filters.eventType,
      status: filters.status,
      sourceModule: filters.sourceModule,
      limit: 100,
    }),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">مراقبة الأحداث</h1>
            <p className="text-muted-foreground mt-1">
              متابعة الأحداث في الوقت الفعلي عبر جميع الأنظمة
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">متصل مباشر</span>
          </div>
        </div>

        {/* Statistics Cards */}
        <EventStatistics events={events} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <EventFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Events Content */}
          <div className="lg:col-span-3">
            <div className="bg-card border rounded-lg">
              <div className="border-b p-4">
                <h2 className="text-lg font-semibold">سجل الأحداث</h2>
              </div>
              
              <div className="p-4">
                {/* View Mode Tabs */}
                <div className="flex gap-2 mb-4 border-b">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    القائمة
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      viewMode === 'timeline'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    الخط الزمني
                  </button>
                </div>

                {/* Content */}
                {viewMode === 'list' ? (
                  <EventsListLive
                    events={events}
                    isLoading={isLoading}
                    onSelectEvent={setSelectedEvent}
                    selectedEventId={selectedEvent?.id}
                  />
                ) : (
                  <EventTimeline events={events} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Panel */}
        {selectedEvent && (
          <div className="bg-card border border-primary rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">تفاصيل الحدث</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">نوع الحدث</p>
                <p className="font-medium">{selectedEvent.event_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الفئة</p>
                <p className="font-medium">{selectedEvent.event_category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المصدر</p>
                <p className="font-medium">{selectedEvent.source_module}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الأولوية</p>
                <p className="font-medium">{selectedEvent.priority}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">التاريخ</p>
                <p className="font-medium">
                  {new Date(selectedEvent.created_at).toLocaleString('ar-SA')}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">البيانات</p>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-60">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
