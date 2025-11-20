/**
 * Event Queue Management Utilities
 * 
 * أدوات إدارة طوابير الأحداث للمعالجة المتسلسلة
 */

import type { SystemEvent } from '../event.types';

/**
 * واجهة عنصر الطابور
 */
export interface QueueItem<T = any> {
  id: string;
  event: SystemEvent;
  data: T;
  priority: number;
  retryCount: number;
  maxRetries: number;
  addedAt: Date;
  processingStartedAt?: Date;
  lastAttemptAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * مدير الطابور
 */
export class EventQueue<T = any> {
  private queue: QueueItem<T>[] = [];
  private processing = false;
  private maxConcurrent: number;
  private currentProcessing = 0;

  constructor(maxConcurrent: number = 1) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * إضافة حدث إلى الطابور
   */
  enqueue(
    event: SystemEvent,
    data: T,
    priority: number = 0,
    maxRetries: number = 3
  ): string {
    const item: QueueItem<T> = {
      id: `${event.id}_${Date.now()}`,
      event,
      data,
      priority,
      retryCount: 0,
      maxRetries,
      addedAt: new Date(),
      status: 'pending',
    };

    this.queue.push(item);
    this.sortByPriority();

    return item.id;
  }

  /**
   * إزالة حدث من الطابور
   */
  dequeue(): QueueItem<T> | undefined {
    return this.queue.shift();
  }

  /**
   * الحصول على الحدث التالي دون إزالته
   */
  peek(): QueueItem<T> | undefined {
    return this.queue[0];
  }

  /**
   * فرز الطابور حسب الأولوية
   */
  private sortByPriority(): void {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * معالجة الطابور
   */
  async process(
    handler: (item: QueueItem<T>) => Promise<void>
  ): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
      const item = this.dequeue();
      if (!item) break;

      this.currentProcessing++;
      this.processItem(item, handler)
        .finally(() => {
          this.currentProcessing--;
        });
    }

    this.processing = false;
  }

  /**
   * معالجة عنصر واحد
   */
  private async processItem(
    item: QueueItem<T>,
    handler: (item: QueueItem<T>) => Promise<void>
  ): Promise<void> {
    item.status = 'processing';
    item.processingStartedAt = new Date();
    item.lastAttemptAt = new Date();

    try {
      await handler(item);
      item.status = 'completed';
    } catch (error) {
      item.error = error instanceof Error ? error.message : String(error);
      item.retryCount++;

      if (item.retryCount < item.maxRetries) {
        // إعادة إضافة العنصر للطابور
        item.status = 'pending';
        this.queue.unshift(item);
      } else {
        item.status = 'failed';
      }
    }
  }

  /**
   * الحصول على حجم الطابور
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * مسح الطابور
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * الحصول على جميع العناصر
   */
  getAll(): QueueItem<T>[] {
    return [...this.queue];
  }

  /**
   * الحصول على العناصر حسب الحالة
   */
  getByStatus(status: QueueItem<T>['status']): QueueItem<T>[] {
    return this.queue.filter(item => item.status === status);
  }

  /**
   * إلغاء عنصر
   */
  cancel(itemId: string): boolean {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * إعادة محاولة العناصر الفاشلة
   */
  retryFailed(): void {
    const failed = this.queue.filter(item => item.status === 'failed');
    failed.forEach(item => {
      item.status = 'pending';
      item.retryCount = 0;
      item.error = undefined;
    });
    this.sortByPriority();
  }

  /**
   * الحصول على إحصائيات الطابور
   */
  getStats() {
    return {
      total: this.queue.length,
      pending: this.getByStatus('pending').length,
      processing: this.getByStatus('processing').length,
      completed: this.getByStatus('completed').length,
      failed: this.getByStatus('failed').length,
      currentProcessing: this.currentProcessing,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

/**
 * مدير طوابير متعددة
 */
export class MultiQueueManager {
  private queues: Map<string, EventQueue> = new Map();

  /**
   * إنشاء طابور جديد
   */
  createQueue(name: string, maxConcurrent: number = 1): EventQueue {
    const queue = new EventQueue(maxConcurrent);
    this.queues.set(name, queue);
    return queue;
  }

  /**
   * الحصول على طابور
   */
  getQueue(name: string): EventQueue | undefined {
    return this.queues.get(name);
  }

  /**
   * حذف طابور
   */
  deleteQueue(name: string): boolean {
    return this.queues.delete(name);
  }

  /**
   * الحصول على جميع الطوابير
   */
  getAllQueues(): Map<string, EventQueue> {
    return this.queues;
  }

  /**
   * مسح جميع الطوابير
   */
  clearAll(): void {
    this.queues.forEach(queue => queue.clear());
  }

  /**
   * الحصول على إحصائيات جميع الطوابير
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    this.queues.forEach((queue, name) => {
      stats[name] = queue.getStats();
    });
    return stats;
  }
}

/**
 * طابور مع جدولة زمنية
 */
export class ScheduledEventQueue<T = any> extends EventQueue<T> {
  private scheduledItems: Map<string, NodeJS.Timeout> = new Map();

  /**
   * جدولة حدث للتنفيذ لاحقاً
   */
  schedule(
    event: SystemEvent,
    data: T,
    delayMs: number,
    priority: number = 0,
    maxRetries: number = 3
  ): string {
    const itemId = `scheduled_${event.id}_${Date.now()}`;

    const timeout = setTimeout(() => {
      this.enqueue(event, data, priority, maxRetries);
      this.scheduledItems.delete(itemId);
    }, delayMs);

    this.scheduledItems.set(itemId, timeout);
    return itemId;
  }

  /**
   * إلغاء حدث مجدول
   */
  cancelScheduled(itemId: string): boolean {
    const timeout = this.scheduledItems.get(itemId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledItems.delete(itemId);
      return true;
    }
    return false;
  }

  /**
   * إلغاء جميع الأحداث المجدولة
   */
  cancelAllScheduled(): void {
    this.scheduledItems.forEach(timeout => clearTimeout(timeout));
    this.scheduledItems.clear();
  }

  /**
   * الحصول على عدد الأحداث المجدولة
   */
  getScheduledCount(): number {
    return this.scheduledItems.size;
  }

  /**
   * تنظيف عند الإزالة
   */
  dispose(): void {
    this.cancelAllScheduled();
    this.clear();
  }
}
