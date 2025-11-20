/**
 * Event Batching System
 * 
 * Optimizes event publishing by batching multiple events together
 * to reduce database round-trips and improve performance
 */

import type { PublishEventParams, SystemEvent } from '../event.types';

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTimeMs: number;
  enableBatching: boolean;
}

interface BatchQueueItem {
  params: PublishEventParams;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export class EventBatcher {
  private queue: BatchQueueItem[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processing = false;

  private config: BatchConfig = {
    maxBatchSize: 50,
    maxWaitTimeMs: 1000,
    enableBatching: true,
  };

  constructor(
    private publishFn: (params: PublishEventParams[]) => Promise<any[]>,
    config?: Partial<BatchConfig>
  ) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Add event to batch queue
   */
  async add(params: PublishEventParams): Promise<any> {
    if (!this.config.enableBatching) {
      // If batching disabled, publish immediately
      return this.publishFn([params]);
    }

    return new Promise((resolve, reject) => {
      this.queue.push({
        params,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Check if we should flush immediately
      if (this.queue.length >= this.config.maxBatchSize) {
        this.flush();
      } else if (!this.timer) {
        // Start timer for auto-flush
        this.timer = setTimeout(() => {
          this.flush();
        }, this.config.maxWaitTimeMs);
      }
    });
  }

  /**
   * Flush current batch to database
   */
  async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Get current batch
    const batch = [...this.queue];
    this.queue = [];

    try {
      const params = batch.map(item => item.params);
      const results = await this.publishFn(params);

      // Resolve all promises
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });

      console.log(`✅ Flushed batch of ${batch.length} events`);
    } catch (error) {
      console.error('❌ Error flushing batch:', error);
      
      // Reject all promises
      batch.forEach(item => {
        item.reject(error);
      });
    } finally {
      this.processing = false;

      // If new items were added during processing, schedule next flush
      if (this.queue.length > 0) {
        this.timer = setTimeout(() => {
          this.flush();
        }, this.config.maxWaitTimeMs);
      }
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get oldest item age in milliseconds
   */
  getOldestItemAge(): number {
    if (this.queue.length === 0) return 0;
    return Date.now() - this.queue[0].timestamp;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Disable batching and flush immediately
   */
  async disable(): Promise<void> {
    this.config.enableBatching = false;
    await this.flush();
  }
}
