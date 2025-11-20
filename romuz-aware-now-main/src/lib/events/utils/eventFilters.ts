/**
 * Event Filtering Utilities
 * 
 * أدوات تصفية الأحداث بناءً على معايير مختلفة
 */

import type { SystemEvent, EventCategory, EventPriority } from '../event.types';

/**
 * تصفية الأحداث حسب الفئة
 */
export function filterByCategory(
  events: SystemEvent[],
  category: EventCategory
): SystemEvent[] {
  return events.filter(event => event.event_category === category);
}

/**
 * تصفية الأحداث حسب الأولوية
 */
export function filterByPriority(
  events: SystemEvent[],
  priority: EventPriority
): SystemEvent[] {
  return events.filter(event => event.priority === priority);
}

/**
 * تصفية الأحداث حسب نوع الحدث
 */
export function filterByEventType(
  events: SystemEvent[],
  eventType: string
): SystemEvent[] {
  return events.filter(event => event.event_type === eventType);
}

/**
 * تصفية الأحداث حسب المصدر
 */
export function filterBySourceModule(
  events: SystemEvent[],
  sourceModule: string
): SystemEvent[] {
  return events.filter(event => event.source_module === sourceModule);
}

/**
 * تصفية الأحداث حسب الفترة الزمنية
 */
export function filterByDateRange(
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
 * تصفية الأحداث حسب الكيان
 */
export function filterByEntity(
  events: SystemEvent[],
  entityType: string,
  entityId: string
): SystemEvent[] {
  return events.filter(
    event => event.entity_type === entityType && event.entity_id === entityId
  );
}

/**
 * تصفية الأحداث حسب المستخدم
 */
export function filterByUser(
  events: SystemEvent[],
  userId: string
): SystemEvent[] {
  return events.filter(event => event.user_id === userId);
}

/**
 * تصفية الأحداث حسب الحالة
 */
export function filterByStatus(
  events: SystemEvent[],
  status: SystemEvent['status']
): SystemEvent[] {
  return events.filter(event => event.status === status);
}

/**
 * تصفية متقدمة بمعايير متعددة
 */
export interface EventFilterCriteria {
  category?: EventCategory;
  priority?: EventPriority;
  eventType?: string;
  sourceModule?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  status?: SystemEvent['status'];
  startDate?: Date;
  endDate?: Date;
  searchText?: string;
}

export function filterEvents(
  events: SystemEvent[],
  criteria: EventFilterCriteria
): SystemEvent[] {
  let filtered = [...events];

  if (criteria.category) {
    filtered = filterByCategory(filtered, criteria.category);
  }

  if (criteria.priority) {
    filtered = filterByPriority(filtered, criteria.priority);
  }

  if (criteria.eventType) {
    filtered = filterByEventType(filtered, criteria.eventType);
  }

  if (criteria.sourceModule) {
    filtered = filterBySourceModule(filtered, criteria.sourceModule);
  }

  if (criteria.entityType && criteria.entityId) {
    filtered = filterByEntity(filtered, criteria.entityType, criteria.entityId);
  }

  if (criteria.userId) {
    filtered = filterByUser(filtered, criteria.userId);
  }

  if (criteria.status) {
    filtered = filterByStatus(filtered, criteria.status);
  }

  if (criteria.startDate && criteria.endDate) {
    filtered = filterByDateRange(filtered, criteria.startDate, criteria.endDate);
  }

  if (criteria.searchText) {
    const searchLower = criteria.searchText.toLowerCase();
    filtered = filtered.filter(event =>
      event.event_type.toLowerCase().includes(searchLower) ||
      event.source_module.toLowerCase().includes(searchLower) ||
      JSON.stringify(event.payload).toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

/**
 * فرز الأحداث حسب التاريخ
 */
export function sortByDate(
  events: SystemEvent[],
  order: 'asc' | 'desc' = 'desc'
): SystemEvent[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

/**
 * فرز الأحداث حسب الأولوية
 */
export function sortByPriority(
  events: SystemEvent[],
  order: 'asc' | 'desc' = 'desc'
): SystemEvent[] {
  const priorityOrder: Record<EventPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...events].sort((a, b) => {
    const priorityA = priorityOrder[a.priority];
    const priorityB = priorityOrder[b.priority];
    return order === 'desc' ? priorityB - priorityA : priorityA - priorityB;
  });
}

/**
 * تجميع الأحداث حسب الفئة
 */
export function groupByCategory(events: SystemEvent[]): Record<EventCategory, SystemEvent[]> {
  return events.reduce((acc, event) => {
    if (!acc[event.event_category]) {
      acc[event.event_category] = [];
    }
    acc[event.event_category].push(event);
    return acc;
  }, {} as Record<EventCategory, SystemEvent[]>);
}

/**
 * تجميع الأحداث حسب نوع الحدث
 */
export function groupByEventType(events: SystemEvent[]): Record<string, SystemEvent[]> {
  return events.reduce((acc, event) => {
    if (!acc[event.event_type]) {
      acc[event.event_type] = [];
    }
    acc[event.event_type].push(event);
    return acc;
  }, {} as Record<string, SystemEvent[]>);
}

/**
 * تجميع الأحداث حسب التاريخ (يوم/شهر/سنة)
 */
export function groupByDate(
  events: SystemEvent[],
  granularity: 'day' | 'month' | 'year' = 'day'
): Record<string, SystemEvent[]> {
  return events.reduce((acc, event) => {
    const date = new Date(event.created_at);
    let key: string;

    switch (granularity) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
    }

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {} as Record<string, SystemEvent[]>);
}
