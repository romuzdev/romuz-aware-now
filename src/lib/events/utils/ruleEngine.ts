/**
 * Rule Engine Utilities
 * 
 * أدوات محرك القواعد للتحقق من الشروط وتنفيذ الإجراءات
 */

import type {
  SystemEvent,
  RuleConditions,
  RuleCondition,
  ConditionOperator,
  RuleAction,
} from '../event.types';

/**
 * تقييم شرط واحد
 */
export function evaluateCondition(
  condition: RuleCondition,
  event: SystemEvent
): boolean {
  const fieldValue = getFieldValue(event, condition.field);
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'eq':
      return fieldValue == compareValue;
    
    case 'neq':
      return fieldValue != compareValue;
    
    case 'gt':
      return Number(fieldValue) > Number(compareValue);
    
    case 'gte':
      return Number(fieldValue) >= Number(compareValue);
    
    case 'lt':
      return Number(fieldValue) < Number(compareValue);
    
    case 'lte':
      return Number(fieldValue) <= Number(compareValue);
    
    case 'contains':
      return String(fieldValue).includes(String(compareValue));
    
    case 'not_contains':
      return !String(fieldValue).includes(String(compareValue));
    
    case 'starts_with':
      return String(fieldValue).startsWith(String(compareValue));
    
    case 'ends_with':
      return String(fieldValue).endsWith(String(compareValue));
    
    case 'in':
      const inList = Array.isArray(compareValue) 
        ? compareValue 
        : String(compareValue).split(',').map(v => v.trim());
      return inList.includes(String(fieldValue));
    
    case 'not_in':
      const notInList = Array.isArray(compareValue)
        ? compareValue
        : String(compareValue).split(',').map(v => v.trim());
      return !notInList.includes(String(fieldValue));
    
    case 'is_null':
      return fieldValue === null || fieldValue === undefined;
    
    case 'is_not_null':
      return fieldValue !== null && fieldValue !== undefined;
    
    default:
      return false;
  }
}

/**
 * الحصول على قيمة حقل من الحدث (يدعم nested fields)
 */
function getFieldValue(event: SystemEvent, fieldPath: string): any {
  const parts = fieldPath.split('.');
  let value: any = event;

  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * تقييم مجموعة شروط (AND/OR logic)
 */
export function evaluateConditions(
  conditions: RuleConditions,
  event: SystemEvent
): boolean {
  if (conditions.rules.length === 0) {
    return true; // No conditions = always true
  }

  const results = conditions.rules.map(rule => evaluateCondition(rule, event));

  if (conditions.logic === 'AND') {
    return results.every(result => result === true);
  } else {
    return results.some(result => result === true);
  }
}

/**
 * تقييم ما إذا كانت القاعدة تطابق الحدث
 */
export function matchesRule(
  rule: {
    trigger_event_types: string[];
    conditions: RuleConditions;
    is_enabled: boolean;
  },
  event: SystemEvent
): boolean {
  // Check if rule is enabled
  if (!rule.is_enabled) {
    return false;
  }

  // Check if event type matches
  if (!rule.trigger_event_types.includes(event.event_type)) {
    return false;
  }

  // Evaluate conditions
  return evaluateConditions(rule.conditions, event);
}

/**
 * تنفيذ إجراء واحد (client-side simulation)
 */
export async function executeAction(
  action: RuleAction,
  event: SystemEvent
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    console.log(`تنفيذ إجراء: ${action.action_type}`, {
      event: event.event_type,
      config: action.config,
    });

    // هنا يمكن استدعاء الـ backend functions
    // لكن للآن سنعيد نتيجة محاكاة
    
    return {
      success: true,
      result: {
        action_type: action.action_type,
        executed_at: new Date().toISOString(),
        event_id: event.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * تنفيذ جميع إجراءات القاعدة
 */
export async function executeRuleActions(
  actions: RuleAction[],
  event: SystemEvent
): Promise<{
  success: boolean;
  results: Array<{ action_type: string; success: boolean; result?: any; error?: string }>;
}> {
  const results = [];
  let overallSuccess = true;

  for (const action of actions) {
    const result = await executeAction(action, event);
    results.push({
      action_type: action.action_type,
      ...result,
    });

    if (!result.success) {
      overallSuccess = false;
    }
  }

  return {
    success: overallSuccess,
    results,
  };
}

/**
 * التحقق من صحة تكوين القاعدة
 */
export function validateRule(rule: Partial<{
  rule_name: string;
  trigger_event_types: string[];
  actions: RuleAction[];
  conditions: RuleConditions;
}>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rule.rule_name || rule.rule_name.trim() === '') {
    errors.push('اسم القاعدة مطلوب');
  }

  if (!rule.trigger_event_types || rule.trigger_event_types.length === 0) {
    errors.push('يجب اختيار حدث محفز واحد على الأقل');
  }

  if (!rule.actions || rule.actions.length === 0) {
    errors.push('يجب إضافة إجراء واحد على الأقل');
  }

  // Validate each action has required config
  rule.actions?.forEach((action, index) => {
    if (!action.action_type) {
      errors.push(`الإجراء ${index + 1}: نوع الإجراء مطلوب`);
    }
  });

  // Validate conditions syntax
  rule.conditions?.rules?.forEach((condition, index) => {
    if (!condition.field) {
      errors.push(`الشرط ${index + 1}: الحقل مطلوب`);
    }
    if (!condition.operator) {
      errors.push(`الشرط ${index + 1}: المقارنة مطلوبة`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
