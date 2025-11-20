/**
 * Event System Metrics Collection
 * 
 * Tracks performance metrics and health of the event system
 */

import type { EventCategory, EventPriority } from '../event.types';

export interface EventMetrics {
  totalEvents: number;
  eventsByCategory: Record<string, number>;
  eventsByPriority: Record<EventPriority, number>;
  eventsPerSecond: number;
  eventsPerMinute: number;
  averageProcessingTime: number;
  failedEvents: number;
  throttledEvents: number;
  cachedHits: number;
  cachedMisses: number;
  batchesProcessed: number;
  lastUpdated: string;
}

export interface PerformanceMetrics {
  avgPublishTime: number;
  avgProcessTime: number;
  p50PublishTime: number;
  p95PublishTime: number;
  p99PublishTime: number;
  slowestEvent: {
    event_type: string;
    duration: number;
  } | null;
  fastestEvent: {
    event_type: string;
    duration: number;
  } | null;
}

export interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  eventProcessingRate: number;
  errorRate: number;
  throttleRate: number;
  cacheHitRate: number;
  lastHealthCheck: string;
  issues: string[];
}

export class EventMetricsCollector {
  private metrics: EventMetrics = {
    totalEvents: 0,
    eventsByCategory: {},
    eventsByPriority: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
    eventsPerSecond: 0,
    eventsPerMinute: 0,
    averageProcessingTime: 0,
    failedEvents: 0,
    throttledEvents: 0,
    cachedHits: 0,
    cachedMisses: 0,
    batchesProcessed: 0,
    lastUpdated: new Date().toISOString(),
  };

  private performanceData: number[] = [];
  private maxPerformanceDataPoints = 1000;
  private startTime = Date.now();

  /**
   * Record event publication
   */
  recordEvent(category: EventCategory, priority: EventPriority, duration: number): void {
    this.metrics.totalEvents++;
    
    // By category
    this.metrics.eventsByCategory[category] = (this.metrics.eventsByCategory[category] || 0) + 1;
    
    // By priority
    this.metrics.eventsByPriority[priority]++;
    
    // Performance tracking
    this.performanceData.push(duration);
    if (this.performanceData.length > this.maxPerformanceDataPoints) {
      this.performanceData.shift();
    }
    
    // Update average processing time
    const sum = this.performanceData.reduce((a, b) => a + b, 0);
    this.metrics.averageProcessingTime = sum / this.performanceData.length;
    
    this.metrics.lastUpdated = new Date().toISOString();
  }

  /**
   * Record failed event
   */
  recordFailure(): void {
    this.metrics.failedEvents++;
    this.metrics.lastUpdated = new Date().toISOString();
  }

  /**
   * Record throttled event
   */
  recordThrottle(): void {
    this.metrics.throttledEvents++;
    this.metrics.lastUpdated = new Date().toISOString();
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.metrics.cachedHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.metrics.cachedMisses++;
  }

  /**
   * Record batch processing
   */
  recordBatch(size: number): void {
    this.metrics.batchesProcessed++;
  }

  /**
   * Get current metrics
   */
  getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    if (this.performanceData.length === 0) {
      return {
        avgPublishTime: 0,
        avgProcessTime: 0,
        p50PublishTime: 0,
        p95PublishTime: 0,
        p99PublishTime: 0,
        slowestEvent: null,
        fastestEvent: null,
      };
    }

    const sorted = [...this.performanceData].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      avgPublishTime: sum / sorted.length,
      avgProcessTime: sum / sorted.length,
      p50PublishTime: sorted[Math.floor(sorted.length * 0.5)],
      p95PublishTime: sorted[Math.floor(sorted.length * 0.95)],
      p99PublishTime: sorted[Math.floor(sorted.length * 0.99)],
      slowestEvent: {
        event_type: 'unknown',
        duration: sorted[sorted.length - 1],
      },
      fastestEvent: {
        event_type: 'unknown',
        duration: sorted[0],
      },
    };
  }

  /**
   * Get health status
   */
  getHealthMetrics(): HealthMetrics {
    const uptime = Date.now() - this.startTime;
    const total = this.metrics.totalEvents;
    const errorRate = total > 0 ? (this.metrics.failedEvents / total) * 100 : 0;
    const throttleRate = total > 0 ? (this.metrics.throttledEvents / total) * 100 : 0;
    const cacheTotal = this.metrics.cachedHits + this.metrics.cachedMisses;
    const cacheHitRate = cacheTotal > 0 ? (this.metrics.cachedHits / cacheTotal) * 100 : 0;
    const eventProcessingRate = uptime > 0 ? (total / (uptime / 1000)) : 0;

    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check for issues
    if (errorRate > 10) {
      issues.push('High error rate detected');
      status = 'unhealthy';
    } else if (errorRate > 5) {
      issues.push('Elevated error rate');
      status = 'degraded';
    }

    if (throttleRate > 20) {
      issues.push('High throttle rate - consider increasing limits');
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    if (cacheHitRate < 30 && cacheTotal > 100) {
      issues.push('Low cache hit rate');
    }

    if (this.metrics.averageProcessingTime > 1000) {
      issues.push('Slow event processing detected');
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    return {
      status,
      uptime,
      eventProcessingRate,
      errorRate,
      throttleRate,
      cacheHitRate,
      lastHealthCheck: new Date().toISOString(),
      issues,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      totalEvents: 0,
      eventsByCategory: {},
      eventsByPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      eventsPerSecond: 0,
      eventsPerMinute: 0,
      averageProcessingTime: 0,
      failedEvents: 0,
      throttledEvents: 0,
      cachedHits: 0,
      cachedMisses: 0,
      batchesProcessed: 0,
      lastUpdated: new Date().toISOString(),
    };
    this.performanceData = [];
    this.startTime = Date.now();
  }
}

/**
 * Global metrics collector instance
 */
export const metricsCollector = new EventMetricsCollector();
