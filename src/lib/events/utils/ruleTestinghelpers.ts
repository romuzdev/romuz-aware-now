/**
 * Rule Testing Helpers
 * 
 * أدوات اختبار قواعد الأتمتة
 */

import type { SystemEvent, AutomationRule } from '../event.types';
import { evaluateConditions, matchesRule } from './ruleEngine';

/**
 * إنشاء حدث تجريبي للاختبار
 */
export function createTestEvent(
  eventType: string,
  category: string,
  payload: Record<string, any> = {}
): SystemEvent {
  return {
    id: `test_${Date.now()}`,
    tenant_id: 'test_tenant',
    event_type: eventType,
    event_category: category as any,
    source_module: 'test',
    priority: 'medium',
    payload,
    metadata: {},
    created_at: new Date().toISOString(),
    status: 'pending',
  };
}

/**
 * محاكاة تنفيذ القاعدة (للاختبار)
 */
export async function simulateRuleExecution(
  rule: {
    rule_name: string;
    trigger_event_types: string[];
    conditions: any;
    actions: any[];
  },
  testEvent: SystemEvent
): Promise<{
  matches: boolean;
  conditionResults: Array<{ field: string; operator: string; result: boolean }>;
  executionResults?: Array<{ action_type: string; success: boolean }>;
}> {
  const matches = rule.trigger_event_types.includes(testEvent.event_type);
  
  if (!matches) {
    return {
      matches: false,
      conditionResults: [],
    };
  }

  const conditionResults = rule.conditions.rules?.map((condition: any) => ({
    field: condition.field,
    operator: condition.operator,
    result: true, // Simplified for now
  })) || [];

  const conditionsPassed = evaluateConditions(rule.conditions, testEvent);
  
  if (!conditionsPassed) {
    return {
      matches: true,
      conditionResults,
    };
  }

  const executionResults = rule.actions.map((action: any) => ({
    action_type: action.action_type,
    success: true,
  }));

  return {
    matches: true,
    conditionResults,
    executionResults,
  };
}

/**
 * اختبار القاعدة مع أحداث متعددة
 */
export function testRuleWithEvents(
  rule: Pick<AutomationRule, 'trigger_event_types' | 'conditions' | 'is_enabled'>,
  testEvents: SystemEvent[]
): {
  totalTests: number;
  matchedCount: number;
  results: Array<{
    event: SystemEvent;
    matched: boolean;
    reason?: string;
  }>;
} {
  const results = testEvents.map(event => {
    const matched = matchesRule(rule, event);
    let reason: string | undefined;

    if (!rule.is_enabled) {
      reason = 'القاعدة معطلة';
    } else if (!rule.trigger_event_types.includes(event.event_type)) {
      reason = 'نوع الحدث غير مطابق';
    } else if (!evaluateConditions(rule.conditions, event)) {
      reason = 'الشروط غير محققة';
    }

    return {
      event,
      matched,
      reason: matched ? undefined : reason,
    };
  });

  return {
    totalTests: testEvents.length,
    matchedCount: results.filter(r => r.matched).length,
    results,
  };
}

/**
 * توليد أحداث تجريبية شائعة
 */
export function generateSampleEvents(): SystemEvent[] {
  return [
    // Policy Events
    createTestEvent('policy_created', 'policy', {
      policy_code: 'POL-001',
      category: 'security',
      version: '1.0',
    }),
    
    createTestEvent('policy_published', 'policy', {
      policy_code: 'POL-002',
      version: '2.0',
      effective_date: '2025-01-01',
    }),

    // Action Events
    createTestEvent('action_created', 'action', {
      title_ar: 'إجراء تصحيحي',
      priority: 'critical',
      due_date: '2025-12-31',
    }),

    createTestEvent('action_overdue', 'action', {
      title_ar: 'إجراء متأخر',
      days_overdue: 5,
      priority: 'high',
    }),

    // KPI Events
    createTestEvent('kpi_threshold_breach', 'kpi', {
      kpi_key: 'awareness_score',
      current_value: 45,
      target_value: 80,
      breach_percentage: 43.75,
    }),

    // Campaign Events
    createTestEvent('campaign_started', 'campaign', {
      name: 'حملة التوعية 2025',
      participant_count: 150,
    }),

    // Training Events
    createTestEvent('certificate_issued', 'training', {
      course_title: 'أساسيات الأمن السيبراني',
      user_id: 'user_123',
      score: 92,
    }),

    // Alert Events
    createTestEvent('alert_triggered', 'alert', {
      alert_type: 'system',
      severity: 'critical',
      message: 'تحذير: نشاط غير معتاد',
    }),
  ];
}

/**
 * تحليل أداء القاعدة
 */
export interface RulePerformanceMetrics {
  rule_id: string;
  rule_name: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  avg_execution_time_ms?: number;
  last_executed_at?: string;
  most_common_trigger: string;
}

export function analyzeRulePerformance(
  rule: AutomationRule,
  executionLogs: Array<{
    event_type: string;
    execution_status: string;
    execution_duration_ms?: number;
    executed_at: string;
  }>
): RulePerformanceMetrics {
  const totalExecutions = executionLogs.length;
  const successfulExecutions = executionLogs.filter(
    log => log.execution_status === 'success'
  ).length;
  const failedExecutions = executionLogs.filter(
    log => log.execution_status === 'failed'
  ).length;

  const successRate = totalExecutions > 0
    ? (successfulExecutions / totalExecutions) * 100
    : 0;

  // Calculate average execution time
  const durationsWithValues = executionLogs.filter(
    log => log.execution_duration_ms !== undefined
  );
  const avgExecutionTime = durationsWithValues.length > 0
    ? durationsWithValues.reduce((sum, log) => sum + (log.execution_duration_ms || 0), 0) /
      durationsWithValues.length
    : undefined;

  // Find most common trigger
  const triggerCounts = executionLogs.reduce((acc, log) => {
    acc[log.event_type] = (acc[log.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonTrigger = Object.entries(triggerCounts).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] || '';

  const lastExecutedAt = executionLogs.length > 0
    ? executionLogs.sort(
        (a, b) =>
          new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
      )[0].executed_at
    : undefined;

  return {
    rule_id: rule.id,
    rule_name: rule.rule_name,
    total_executions: totalExecutions,
    successful_executions: successfulExecutions,
    failed_executions: failedExecutions,
    success_rate: successRate,
    avg_execution_time_ms: avgExecutionTime,
    last_executed_at: lastExecutedAt,
    most_common_trigger: mostCommonTrigger,
  };
}

/**
 * اقتراحات لتحسين القاعدة
 */
export interface RuleOptimizationSuggestion {
  type: 'warning' | 'info' | 'tip';
  message: string;
  action?: string;
}

export function getRuleOptimizationSuggestions(
  rule: AutomationRule,
  metrics?: RulePerformanceMetrics
): RuleOptimizationSuggestion[] {
  const suggestions: RuleOptimizationSuggestion[] = [];

  // Check if rule has too many trigger events
  if (rule.trigger_event_types.length > 10) {
    suggestions.push({
      type: 'warning',
      message: 'القاعدة تستمع لأكثر من 10 أحداث',
      action: 'فكر في تقسيمها إلى قواعد متعددة',
    });
  }

  // Check if rule has no conditions
  if (rule.conditions.rules.length === 0) {
    suggestions.push({
      type: 'info',
      message: 'القاعدة ليس لها شروط',
      action: 'ستُنفذ عند كل حدث محفز - تأكد من أن هذا مقصود',
    });
  }

  // Check if rule has too many actions
  if (rule.actions.length > 5) {
    suggestions.push({
      type: 'tip',
      message: 'القاعدة تحتوي على أكثر من 5 إجراءات',
      action: 'قد يؤثر ذلك على وقت التنفيذ',
    });
  }

  // Check performance metrics
  if (metrics) {
    if (metrics.success_rate < 80) {
      suggestions.push({
        type: 'warning',
        message: `معدل النجاح منخفض: ${metrics.success_rate.toFixed(1)}%`,
        action: 'راجع الأخطاء وحسّن تكوين الإجراءات',
      });
    }

    if (metrics.avg_execution_time_ms && metrics.avg_execution_time_ms > 5000) {
      suggestions.push({
        type: 'warning',
        message: 'متوسط وقت التنفيذ طويل (> 5 ثواني)',
        action: 'فكر في تحسين الإجراءات أو استخدام التنفيذ المؤجل',
      });
    }
  }

  // Priority vs execution mode check
  if (rule.priority >= 90 && rule.execution_mode !== 'immediate') {
    suggestions.push({
      type: 'tip',
      message: 'القاعدة ذات أولوية عالية لكن التنفيذ ليس فورياً',
      action: 'فكر في تغيير وضع التنفيذ إلى "فوري"',
    });
  }

  return suggestions;
}

/**
 * مقارنة نتائج الاختبار قبل وبعد التعديل
 */
export function compareTestResults(
  before: { matched: boolean; conditionResults: any[] },
  after: { matched: boolean; conditionResults: any[] }
): {
  improved: boolean;
  changes: string[];
} {
  const changes: string[] = [];

  if (before.matched !== after.matched) {
    changes.push(
      after.matched
        ? 'القاعدة أصبحت تطابق الحدث ✓'
        : 'القاعدة لم تعد تطابق الحدث ✗'
    );
  }

  const beforePassedCount = before.conditionResults.filter(r => r.result).length;
  const afterPassedCount = after.conditionResults.filter(r => r.result).length;

  if (beforePassedCount !== afterPassedCount) {
    changes.push(
      `الشروط المحققة: ${beforePassedCount} → ${afterPassedCount}`
    );
  }

  return {
    improved: afterPassedCount > beforePassedCount || (after.matched && !before.matched),
    changes,
  };
}
