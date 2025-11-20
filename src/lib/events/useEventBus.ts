/**
 * Event Bus Hook - Core Event System Hook
 * 
 * Provides methods to publish events and subscribe to real-time updates
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import type { SystemEvent, PublishEventParams, EventSubscription } from './event.types';

export function useEventBus() {
  const { tenantId } = useAppContext();
  const subscriptionsRef = useRef<Map<string, EventSubscription>>(new Map());

  /**
   * Publish Event
   * 
   * Publishes a new event to the system and triggers automation rules
   * 
   * @example
   * ```typescript
   * await publishEvent({
   *   event_type: 'policy_created',
   *   event_category: 'policy',
   *   source_module: 'gate_f',
   *   entity_type: 'policy',
   *   entity_id: policyId,
   *   priority: 'high',
   *   payload: { policy_code: 'SEC-001' }
   * });
   * ```
   */
  const publishEvent = useCallback(async (params: PublishEventParams) => {
    if (!tenantId) {
      console.warn('[EventBus] No tenant context');
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('fn_publish_event', {
        p_event_type: params.event_type,
        p_event_category: params.event_category,
        p_source_module: params.source_module,
        p_entity_type: params.entity_type || null,
        p_entity_id: params.entity_id || null,
        p_priority: params.priority || 'medium',
        p_payload: params.payload || {},
        p_metadata: params.metadata || {},
      });

      if (error) throw error;

      console.log(`[EventBus] ✅ Published: ${params.event_type}`, {
        category: params.event_category,
        source: params.source_module,
        priority: params.priority,
      });

      return data[0];
    } catch (error) {
      console.error('[EventBus] ❌ Publish failed:', error);
      throw error;
    }
  }, [tenantId]);

  /**
   * Subscribe to Events
   * 
   * Subscribe to specific event types with a callback function
   * Returns an unsubscribe function
   * 
   * @example
   * ```typescript
   * useEffect(() => {
   *   const unsubscribe = subscribe({
   *     subscriber_module: 'my_component',
   *     event_types: ['policy_created', 'policy_updated'],
   *     callback: (event) => {
   *       console.log('Received:', event);
   *     }
   *   });
   * 
   *   return unsubscribe;
   * }, [subscribe]);
   * ```
   */
  const subscribe = useCallback((subscription: Omit<EventSubscription, 'id'>) => {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    subscriptionsRef.current.set(id, { ...subscription, id });

    console.log(`[EventBus] 📡 Subscribed: ${subscription.subscriber_module}`, {
      event_types: subscription.event_types,
      subscription_id: id,
    });

    // Return unsubscribe function
    return () => {
      subscriptionsRef.current.delete(id);
      console.log(`[EventBus] 🔌 Unsubscribed: ${id}`);
    };
  }, []);

  /**
   * Realtime Event Listener
   * 
   * Listens for new events from the database and notifies all matching subscriptions
   */
  useEffect(() => {
    if (!tenantId) return;

    console.log('[EventBus] 🚀 Starting realtime listener for tenant:', tenantId);

    const channel = supabase
      .channel('system-events-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_events',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const event = payload.new as SystemEvent;
          
          console.log(`[EventBus] 📨 Realtime event received:`, {
            type: event.event_type,
            category: event.event_category,
            source: event.source_module,
            priority: event.priority,
          });

          // Notify all matching subscriptions
          let notifiedCount = 0;
          subscriptionsRef.current.forEach((subscription) => {
            const shouldNotify = 
              subscription.event_types.includes(event.event_type) ||
              subscription.event_types.includes('*') ||
              subscription.event_types.includes(`${event.event_category}:*`);

            if (shouldNotify) {
              try {
                subscription.callback(event);
                notifiedCount++;
              } catch (error) {
                console.error(`[EventBus] ⚠️ Subscription callback error:`, {
                  subscription_id: subscription.id,
                  module: subscription.subscriber_module,
                  error,
                });
              }
            }
          });

          if (notifiedCount > 0) {
            console.log(`[EventBus] ✅ Notified ${notifiedCount} subscriber(s)`);
          }
        }
      )
      .subscribe((status) => {
        console.log('[EventBus] Channel status:', status);
      });

    // Cleanup on unmount
    return () => {
      console.log('[EventBus] 🛑 Stopping realtime listener');
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  /**
   * Get Active Subscriptions Count
   */
  const getSubscriptionsCount = useCallback(() => {
    return subscriptionsRef.current.size;
  }, []);

  return {
    publishEvent,
    subscribe,
    getSubscriptionsCount,
  };
}

/**
 * Convenience Hook for Simple Subscription
 * 
 * @example
 * ```typescript
 * useEventSubscription({
 *   event_types: ['policy_created'],
 *   onEvent: (event) => {
 *     toast('Policy created!');
 *   }
 * });
 * ```
 */
export function useEventSubscription(config: {
  event_types: string[];
  onEvent: (event: SystemEvent) => void;
  enabled?: boolean;
}) {
  const { subscribe } = useEventBus();
  const { event_types, onEvent, enabled = true } = config;

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribe({
      subscriber_module: 'useEventSubscription',
      event_types,
      callback: onEvent,
    });

    return unsubscribe;
  }, [event_types, onEvent, enabled, subscribe]);
}
