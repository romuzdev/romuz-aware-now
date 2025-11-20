/**
 * Gate-L: Analytics & Reports - Event Integration Hook
 * 
 * Integration between Analytics module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useGateLEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Report Generated Event
   */
  const publishReportGenerated = useCallback(async (reportId: string, reportData: any) => {
    const params: PublishEventParams = {
      event_type: 'report_generated',
      event_category: 'analytics',
      source_module: 'gate_l',
      entity_type: 'report',
      entity_id: reportId,
      priority: 'medium',
      payload: {
        report_type: reportData.report_type,
        report_name: reportData.report_name,
        period_start: reportData.period_start,
        period_end: reportData.period_end,
        generated_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Insight Detected Event
   */
  const publishInsightDetected = useCallback(async (insightId: string, insightData: any) => {
    const params: PublishEventParams = {
      event_type: 'insight_detected',
      event_category: 'analytics',
      source_module: 'gate_l',
      entity_type: 'insight',
      entity_id: insightId,
      priority: 'high',
      payload: {
        insight_type: insightData.insight_type,
        title: insightData.title,
        severity: insightData.severity,
        affected_area: insightData.affected_area,
        recommendation: insightData.recommendation,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Anomaly Detected Event
   */
  const publishAnomalyDetected = useCallback(async (anomalyId: string, anomalyData: any) => {
    const params: PublishEventParams = {
      event_type: 'anomaly_detected',
      event_category: 'analytics',
      source_module: 'gate_l',
      entity_type: 'anomaly',
      entity_id: anomalyId,
      priority: 'critical',
      payload: {
        anomaly_type: anomalyData.anomaly_type,
        metric_key: anomalyData.metric_key,
        expected_value: anomalyData.expected_value,
        actual_value: anomalyData.actual_value,
        deviation_percentage: anomalyData.deviation_percentage,
        detected_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishReportGenerated,
    publishInsightDetected,
    publishAnomalyDetected,
  };
}
