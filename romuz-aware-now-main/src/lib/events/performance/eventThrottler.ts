/**
 * Event Throttling System
 * 
 * Prevents event flooding by throttling high-frequency events
 * while preserving important events
 */

import type { PublishEventParams, EventPriority } from '../event.types';

interface ThrottleConfig {
  maxEventsPerSecond: number;
  maxEventsPerMinute: number;
  priorityBypass: EventPriority[];
  enableThrottling: boolean;
}

interface ThrottleStats {
  eventsThisSecond: number;
  eventsThisMinute: number;
  throttledCount: number;
  lastResetSecond: number;
  lastResetMinute: number;
}

export class EventThrottler {
  private config: ThrottleConfig = {
    maxEventsPerSecond: 100,
    maxEventsPerMinute: 1000,
    priorityBypass: ['critical', 'high'],
    enableThrottling: true,
  };

  private stats: ThrottleStats = {
    eventsThisSecond: 0,
    eventsThisMinute: 0,
    throttledCount: 0,
    lastResetSecond: Date.now(),
    lastResetMinute: Date.now(),
  };

  constructor(config?: Partial<ThrottleConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Check if event should be allowed
   */
  shouldAllow(params: PublishEventParams): boolean {
    if (!this.config.enableThrottling) {
      return true;
    }

    // Reset counters if needed
    this.resetCounters();

    // Bypass throttling for high-priority events
    const priority = params.priority || 'medium';
    if (this.config.priorityBypass.includes(priority)) {
      this.incrementCounters();
      return true;
    }

    // Check per-second limit
    if (this.stats.eventsThisSecond >= this.config.maxEventsPerSecond) {
      this.stats.throttledCount++;
      console.warn(`⚠️ Event throttled (per-second limit): ${params.event_type}`);
      return false;
    }

    // Check per-minute limit
    if (this.stats.eventsThisMinute >= this.config.maxEventsPerMinute) {
      this.stats.throttledCount++;
      console.warn(`⚠️ Event throttled (per-minute limit): ${params.event_type}`);
      return false;
    }

    this.incrementCounters();
    return true;
  }

  /**
   * Reset counters if time windows have elapsed
   */
  private resetCounters(): void {
    const now = Date.now();

    // Reset second counter
    if (now - this.stats.lastResetSecond >= 1000) {
      this.stats.eventsThisSecond = 0;
      this.stats.lastResetSecond = now;
    }

    // Reset minute counter
    if (now - this.stats.lastResetMinute >= 60000) {
      this.stats.eventsThisMinute = 0;
      this.stats.lastResetMinute = now;
    }
  }

  /**
   * Increment event counters
   */
  private incrementCounters(): void {
    this.stats.eventsThisSecond++;
    this.stats.eventsThisMinute++;
  }

  /**
   * Get current throttling statistics
   */
  getStats(): ThrottleStats {
    return { ...this.stats };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ThrottleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset all counters and statistics
   */
  reset(): void {
    this.stats = {
      eventsThisSecond: 0,
      eventsThisMinute: 0,
      throttledCount: 0,
      lastResetSecond: Date.now(),
      lastResetMinute: Date.now(),
    };
  }
}
