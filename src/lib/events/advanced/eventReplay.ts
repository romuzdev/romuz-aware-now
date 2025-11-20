/**
 * Event Replay System
 * 
 * Allows replaying historical events for debugging, testing, and recovery
 */

import type { SystemEvent, PublishEventParams } from '../event.types';

export interface ReplayConfig {
  startTime?: string;
  endTime?: string;
  eventTypes?: string[];
  categories?: string[];
  priorities?: string[];
  speed?: number; // Replay speed multiplier (1 = real-time, 2 = 2x speed)
  preserveTimestamps?: boolean;
}

export interface ReplayStats {
  totalEvents: number;
  replayedEvents: number;
  failedEvents: number;
  startedAt: string;
  completedAt?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

export class EventReplayManager {
  private isReplaying = false;
  private stats: ReplayStats = {
    totalEvents: 0,
    replayedEvents: 0,
    failedEvents: 0,
    startedAt: new Date().toISOString(),
    status: 'pending',
  };

  constructor(
    private fetchEventsFn: (config: ReplayConfig) => Promise<SystemEvent[]>,
    private publishFn: (params: PublishEventParams) => Promise<any>
  ) {}

  /**
   * Start event replay
   */
  async startReplay(
    config: ReplayConfig,
    onProgress?: (stats: ReplayStats) => void
  ): Promise<ReplayStats> {
    if (this.isReplaying) {
      throw new Error('Replay already in progress');
    }

    this.isReplaying = true;
    this.stats = {
      totalEvents: 0,
      replayedEvents: 0,
      failedEvents: 0,
      startedAt: new Date().toISOString(),
      status: 'running',
    };

    try {
      console.log('🔄 Starting event replay...', config);

      // Fetch events to replay
      const events = await this.fetchEventsFn(config);
      this.stats.totalEvents = events.length;

      console.log(`📋 Found ${events.length} events to replay`);

      // Sort events by timestamp
      const sortedEvents = events.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Replay events
      for (const event of sortedEvents) {
        if (!this.isReplaying) {
          this.stats.status = 'cancelled';
          break;
        }

        try {
          // Convert SystemEvent to PublishEventParams
          const params: PublishEventParams = {
            event_type: event.event_type,
            event_category: event.event_category,
            source_module: event.source_module,
            entity_type: event.entity_type,
            entity_id: event.entity_id,
            priority: event.priority,
            payload: {
              ...event.payload,
              __replayed: true,
              __original_id: event.id,
              __original_timestamp: event.created_at,
            },
          };

          // Publish replayed event
          await this.publishFn(params);
          this.stats.replayedEvents++;

          // Call progress callback
          if (onProgress) {
            onProgress({ ...this.stats });
          }

          // Apply speed control
          if (config.speed && config.speed < 10) {
            const delay = 100 / config.speed;
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          console.log(`✅ Replayed event ${this.stats.replayedEvents}/${this.stats.totalEvents}`);
        } catch (error) {
          console.error(`❌ Failed to replay event:`, error);
          this.stats.failedEvents++;
        }
      }

      this.stats.completedAt = new Date().toISOString();
      this.stats.status = this.stats.status === 'cancelled' ? 'cancelled' : 'completed';

      console.log('✅ Replay completed:', this.stats);
      return this.stats;
    } catch (error) {
      console.error('❌ Replay failed:', error);
      this.stats.status = 'failed';
      this.stats.completedAt = new Date().toISOString();
      throw error;
    } finally {
      this.isReplaying = false;
    }
  }

  /**
   * Cancel ongoing replay
   */
  cancelReplay(): void {
    if (this.isReplaying) {
      console.log('🛑 Cancelling replay...');
      this.isReplaying = false;
    }
  }

  /**
   * Get current replay statistics
   */
  getStats(): ReplayStats {
    return { ...this.stats };
  }

  /**
   * Check if replay is in progress
   */
  isRunning(): boolean {
    return this.isReplaying;
  }
}
