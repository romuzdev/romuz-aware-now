/**
 * Event History Utilities
 * 
 * أدوات إدارة سجل الأحداث والاستعلام عنها
 */

import type { SystemEvent } from '../event.types';

/**
 * إنشاء timeline للأحداث
 */
export interface EventTimelineItem {
  date: string;
  events: SystemEvent[];
  count: number;
}

export function createEventTimeline(
  events: SystemEvent[],
  granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
): EventTimelineItem[] {
  const grouped = new Map<string, SystemEvent[]>();

  events.forEach(event => {
    const date = new Date(event.created_at);
    let key: string;

    switch (granularity) {
      case 'hour':
        key = `${date.toISOString().split(':')[0]}:00:00`;
        break;
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = getWeekStart(date);
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(event);
  });

  return Array.from(grouped.entries())
    .map(([date, events]) => ({
      date,
      events,
      count: events.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * الحصول على بداية الأسبوع
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * إحصائيات سجل الأحداث
 */
export interface EventHistoryStats {
  totalEvents: number;
  uniqueEventTypes: number;
  mostFrequentEventType: string;
  avgEventsPerDay: number;
  peakDay: string;
  peakDayCount: number;
}

export function getEventHistoryStats(events: SystemEvent[]): EventHistoryStats {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      uniqueEventTypes: 0,
      mostFrequentEventType: '',
      avgEventsPerDay: 0,
      peakDay: '',
      peakDayCount: 0,
    };
  }

  // عدد أنواع الأحداث الفريدة
  const uniqueTypes = new Set(events.map(e => e.event_type));

  // أكثر نوع حدث تكراراً
  const typeCounts = events.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostFrequentType = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)[0];

  // تجميع حسب اليوم
  const dayGroups = events.reduce((acc, event) => {
    const day = event.created_at.split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // اليوم الأكثر نشاطاً
  const peakDay = Object.entries(dayGroups)
    .sort(([, a], [, b]) => b - a)[0];

  // متوسط الأحداث يومياً
  const uniqueDays = Object.keys(dayGroups).length;
  const avgPerDay = events.length / uniqueDays;

  return {
    totalEvents: events.length,
    uniqueEventTypes: uniqueTypes.size,
    mostFrequentEventType: mostFrequentType ? mostFrequentType[0] : '',
    avgEventsPerDay: avgPerDay,
    peakDay: peakDay ? peakDay[0] : '',
    peakDayCount: peakDay ? peakDay[1] : 0,
  };
}

/**
 * الحصول على الأحداث الأخيرة
 */
export function getRecentEvents(
  events: SystemEvent[],
  count: number = 10
): SystemEvent[] {
  return [...events]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, count);
}

/**
 * الحصول على الأحداث في نطاق زمني محدد
 */
export function getEventsInRange(
  events: SystemEvent[],
  startDate: Date,
  endDate: Date
): SystemEvent[] {
  return events.filter(event => {
    const eventDate = new Date(event.created_at);
    return eventDate >= startDate && eventDate <= endDate;
  });
}

/**
 * الحصول على أحداث اليوم
 */
export function getTodayEvents(events: SystemEvent[]): SystemEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getEventsInRange(events, today, tomorrow);
}

/**
 * الحصول على أحداث الأسبوع الحالي
 */
export function getThisWeekEvents(events: SystemEvent[]): SystemEvent[] {
  const today = new Date();
  const weekStart = getWeekStart(today);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return getEventsInRange(events, weekStart, weekEnd);
}

/**
 * الحصول على أحداث الشهر الحالي
 */
export function getThisMonthEvents(events: SystemEvent[]): SystemEvent[] {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  return getEventsInRange(events, monthStart, monthEnd);
}

/**
 * مقارنة فترتين زمنيتين
 */
export interface PeriodComparison {
  currentPeriod: {
    events: SystemEvent[];
    count: number;
  };
  previousPeriod: {
    events: SystemEvent[];
    count: number;
  };
  change: {
    absolute: number;
    percentage: number;
  };
}

export function comparePeriods(
  events: SystemEvent[],
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): PeriodComparison {
  const currentEvents = getEventsInRange(events, currentStart, currentEnd);
  const previousEvents = getEventsInRange(events, previousStart, previousEnd);

  const change = currentEvents.length - previousEvents.length;
  const percentage = previousEvents.length > 0
    ? (change / previousEvents.length) * 100
    : 0;

  return {
    currentPeriod: {
      events: currentEvents,
      count: currentEvents.length,
    },
    previousPeriod: {
      events: previousEvents,
      count: previousEvents.length,
    },
    change: {
      absolute: change,
      percentage,
    },
  };
}

/**
 * تتبع سلسلة الأحداث المترابطة
 */
export function traceEventChain(
  events: SystemEvent[],
  startEventId: string,
  maxDepth: number = 10
): SystemEvent[] {
  const chain: SystemEvent[] = [];
  const visited = new Set<string>();
  
  const startEvent = events.find(e => e.id === startEventId);
  if (!startEvent) return chain;

  chain.push(startEvent);
  visited.add(startEvent.id);

  let currentDepth = 0;
  let currentEntityId = startEvent.entity_id;
  let currentEntityType = startEvent.entity_type;

  while (currentDepth < maxDepth && currentEntityId) {
    const relatedEvents = events.filter(
      e =>
        !visited.has(e.id) &&
        e.entity_id === currentEntityId &&
        e.entity_type === currentEntityType &&
        new Date(e.created_at) > new Date(chain[chain.length - 1].created_at)
    );

    if (relatedEvents.length === 0) break;

    const nextEvent = relatedEvents.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0];

    chain.push(nextEvent);
    visited.add(nextEvent.id);
    currentDepth++;
  }

  return chain;
}
