/**
 * Platform Module - Event Integration Hook
 * 
 * Integration between Platform and Event System
 * Handles: Tenants, Billing, Support, System Events, Platform Config
 */

import { useCallback } from 'react';
import { useEventBus } from '@/lib/events/useEventBus';
import type { PublishEventParams } from '@/lib/events/event.types';

export function usePlatformEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Tenant Created Event
   */
  const publishTenantCreated = useCallback(async (
    tenantId: string,
    tenantData: {
      tenant_name: string;
      plan: string;
      owner_email: string;
      created_by: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'tenant_created',
      event_category: 'platform',
      source_module: 'platform',
      entity_type: 'tenant',
      entity_id: tenantId,
      priority: 'high',
      payload: {
        tenant_id: tenantId,
        tenant_name: tenantData.tenant_name,
        plan: tenantData.plan,
        owner_email: tenantData.owner_email,
        created_by: tenantData.created_by,
        created_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Subscription Updated Event
   */
  const publishSubscriptionUpdated = useCallback(async (
    tenantId: string,
    subscriptionData: {
      old_plan: string;
      new_plan: string;
      billing_cycle: string;
      updated_by: string;
      effective_date: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'subscription_updated',
      event_category: 'platform',
      source_module: 'platform',
      entity_type: 'subscription',
      entity_id: tenantId,
      priority: 'high',
      payload: {
        tenant_id: tenantId,
        old_plan: subscriptionData.old_plan,
        new_plan: subscriptionData.new_plan,
        billing_cycle: subscriptionData.billing_cycle,
        updated_by: subscriptionData.updated_by,
        effective_date: subscriptionData.effective_date,
        updated_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Support Ticket Created Event
   */
  const publishSupportTicketCreated = useCallback(async (
    ticketId: string,
    ticketData: {
      tenant_id: string;
      subject: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      category: string;
      created_by: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'support_ticket_created',
      event_category: 'platform',
      source_module: 'platform',
      entity_type: 'support_ticket',
      entity_id: ticketId,
      priority: ticketData.priority === 'urgent' ? 'critical' : 'medium',
      payload: {
        ticket_id: ticketId,
        tenant_id: ticketData.tenant_id,
        subject: ticketData.subject,
        priority: ticketData.priority,
        category: ticketData.category,
        created_by: ticketData.created_by,
        created_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * System Maintenance Scheduled Event
   */
  const publishMaintenanceScheduled = useCallback(async (
    maintenanceId: string,
    maintenanceData: {
      title: string;
      description: string;
      scheduled_start: string;
      scheduled_end: string;
      affected_services: string[];
      scheduled_by: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'maintenance_scheduled',
      event_category: 'platform',
      source_module: 'platform',
      entity_type: 'maintenance',
      entity_id: maintenanceId,
      priority: 'high',
      payload: {
        maintenance_id: maintenanceId,
        title: maintenanceData.title,
        description: maintenanceData.description,
        scheduled_start: maintenanceData.scheduled_start,
        scheduled_end: maintenanceData.scheduled_end,
        affected_services: maintenanceData.affected_services,
        scheduled_by: maintenanceData.scheduled_by,
        scheduled_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Platform Usage Threshold Exceeded Event
   */
  const publishUsageThresholdExceeded = useCallback(async (
    tenantId: string,
    usageData: {
      metric: string;
      current_value: number;
      threshold: number;
      percentage: number;
      period: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'usage_threshold_exceeded',
      event_category: 'platform',
      source_module: 'platform',
      entity_type: 'usage_alert',
      entity_id: `${tenantId}_${usageData.metric}`,
      priority: 'high',
      payload: {
        tenant_id: tenantId,
        metric: usageData.metric,
        current_value: usageData.current_value,
        threshold: usageData.threshold,
        percentage: usageData.percentage,
        period: usageData.period,
        detected_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishTenantCreated,
    publishSubscriptionUpdated,
    publishSupportTicketCreated,
    publishMaintenanceScheduled,
    publishUsageThresholdExceeded,
  };
}
