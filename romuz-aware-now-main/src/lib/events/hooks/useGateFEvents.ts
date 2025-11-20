/**
 * Gate-F: Policies Management - Event Integration Hook
 * 
 * Integration between Policies module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useGateFEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Policy Created Event
   */
  const publishPolicyCreated = useCallback(async (policyId: string, policyData: any) => {
    const params: PublishEventParams = {
      event_type: 'policy_created',
      event_category: 'policy',
      source_module: 'gate_f',
      entity_type: 'policy',
      entity_id: policyId,
      priority: 'high',
      payload: {
        policy_code: policyData.policy_code,
        category: policyData.category,
        policy_name_ar: policyData.policy_name_ar,
        version: policyData.version,
      },
      metadata: {
        created_at: new Date().toISOString(),
        module: 'gate_f',
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Policy Updated Event
   */
  const publishPolicyUpdated = useCallback(async (policyId: string, changes: any) => {
    const params: PublishEventParams = {
      event_type: 'policy_updated',
      event_category: 'policy',
      source_module: 'gate_f',
      entity_type: 'policy',
      entity_id: policyId,
      priority: 'medium',
      payload: {
        changes,
        updated_fields: Object.keys(changes),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Policy Published Event
   */
  const publishPolicyPublished = useCallback(async (policyId: string, policyData: any) => {
    const params: PublishEventParams = {
      event_type: 'policy_published',
      event_category: 'policy',
      source_module: 'gate_f',
      entity_type: 'policy',
      entity_id: policyId,
      priority: 'high',
      payload: {
        policy_code: policyData.policy_code,
        version: policyData.version,
        effective_date: policyData.effective_date,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Policy Archived Event
   */
  const publishPolicyArchived = useCallback(async (policyId: string, reason?: string) => {
    const params: PublishEventParams = {
      event_type: 'policy_archived',
      event_category: 'policy',
      source_module: 'gate_f',
      entity_type: 'policy',
      entity_id: policyId,
      priority: 'medium',
      payload: {
        reason: reason || 'manual_archive',
        archived_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishPolicyCreated,
    publishPolicyUpdated,
    publishPolicyPublished,
    publishPolicyArchived,
  };
}
