/**
 * Gate-I: KPIs & Metrics - Event Integration Hook
 * 
 * Integration between KPIs module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useGateIEvents() {
  const { publishEvent } = useEventBus();

  /**
   * KPI Created Event
   */
  const publishKPICreated = useCallback(async (kpiId: string, kpiData: any) => {
    const params: PublishEventParams = {
      event_type: 'kpi_created',
      event_category: 'kpi',
      source_module: 'gate_i',
      entity_type: 'kpi',
      entity_id: kpiId,
      priority: 'medium',
      payload: {
        kpi_key: kpiData.kpi_key,
        name_ar: kpiData.name_ar,
        category: kpiData.category,
        target_value: kpiData.target_value,
        unit: kpiData.unit,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * KPI Updated Event
   */
  const publishKPIUpdated = useCallback(async (kpiId: string, oldValue: number, newValue: number, kpiData: any) => {
    const params: PublishEventParams = {
      event_type: 'kpi_updated',
      event_category: 'kpi',
      source_module: 'gate_i',
      entity_type: 'kpi',
      entity_id: kpiId,
      priority: 'medium',
      payload: {
        kpi_key: kpiData.kpi_key,
        old_value: oldValue,
        new_value: newValue,
        change_percentage: ((newValue - oldValue) / oldValue) * 100,
        updated_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * KPI Threshold Breach Event
   */
  const publishKPIThresholdBreach = useCallback(async (
    kpiId: string, 
    thresholdType: 'above' | 'below',
    kpiData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'kpi_threshold_breach',
      event_category: 'kpi',
      source_module: 'gate_i',
      entity_type: 'kpi',
      entity_id: kpiId,
      priority: 'critical',
      payload: {
        kpi_key: kpiData.kpi_key,
        name_ar: kpiData.name_ar,
        current_value: kpiData.current_value,
        target_value: kpiData.target_value,
        threshold_type: thresholdType,
        breach_percentage: Math.abs(((kpiData.current_value - kpiData.target_value) / kpiData.target_value) * 100),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishKPICreated,
    publishKPIUpdated,
    publishKPIThresholdBreach,
  };
}
