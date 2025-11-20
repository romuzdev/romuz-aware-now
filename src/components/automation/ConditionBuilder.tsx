/**
 * Condition Builder Component
 * 
 * بناء الشروط المعقدة للقواعد
 */

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import type { RuleConditions, RuleCondition, ConditionOperator } from '@/lib/events/event.types';

interface ConditionBuilderProps {
  conditions: RuleConditions;
  onChange: (conditions: RuleConditions) => void;
}

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'eq', label: 'يساوي' },
  { value: 'neq', label: 'لا يساوي' },
  { value: 'gt', label: 'أكبر من' },
  { value: 'gte', label: 'أكبر من أو يساوي' },
  { value: 'lt', label: 'أصغر من' },
  { value: 'lte', label: 'أصغر من أو يساوي' },
  { value: 'contains', label: 'يحتوي على' },
  { value: 'not_contains', label: 'لا يحتوي على' },
  { value: 'starts_with', label: 'يبدأ بـ' },
  { value: 'ends_with', label: 'ينتهي بـ' },
  { value: 'in', label: 'ضمن القائمة' },
  { value: 'not_in', label: 'ليس ضمن القائمة' },
  { value: 'is_null', label: 'فارغ' },
  { value: 'is_not_null', label: 'غير فارغ' },
];

const COMMON_FIELDS = [
  'event_type',
  'category',
  'priority',
  'source_module',
  'status',
  'payload.status',
  'payload.severity',
  'payload.value',
  'metadata.user_id',
  'metadata.entity_id',
];

export function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
  const handleAddCondition = () => {
    const newCondition: RuleCondition = {
      field: '',
      operator: 'eq',
      value: '',
    };

    onChange({
      ...conditions,
      rules: [...conditions.rules, newCondition],
    });
  };

  const handleRemoveCondition = (index: number) => {
    onChange({
      ...conditions,
      rules: conditions.rules.filter((_, i) => i !== index),
    });
  };

  const handleUpdateCondition = (index: number, field: keyof RuleCondition, value: any) => {
    const updated = [...conditions.rules];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...conditions, rules: updated });
  };

  const handleToggleLogic = () => {
    onChange({
      ...conditions,
      logic: conditions.logic === 'AND' ? 'OR' : 'AND',
    });
  };

  return (
    <div className="space-y-4">
      {/* Logic Toggle */}
      {conditions.rules.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">المنطق:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleLogic}
            className="w-20"
          >
            {conditions.logic}
          </Button>
          <span className="text-xs text-muted-foreground">
            {conditions.logic === 'AND' ? '(يجب تحقق جميع الشروط)' : '(يكفي تحقق شرط واحد)'}
          </span>
        </div>
      )}

      {/* Conditions List */}
      {conditions.rules.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          لا توجد شروط. ستنفذ القاعدة على جميع الأحداث المحفّزة.
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.rules.map((condition, index) => (
            <div key={index} className="flex items-center gap-3 p-4 border border-border rounded-md bg-muted/30">
              {/* Field */}
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">الحقل</label>
                <input
                  type="text"
                  list={`fields-${index}`}
                  value={condition.field}
                  onChange={(e) => handleUpdateCondition(index, 'field', e.target.value)}
                  placeholder="مثال: payload.status"
                  className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <datalist id={`fields-${index}`}>
                  {COMMON_FIELDS.map((field) => (
                    <option key={field} value={field} />
                  ))}
                </datalist>
              </div>

              {/* Operator */}
              <div className="w-48">
                <label className="block text-xs text-muted-foreground mb-1">المقارنة</label>
                <select
                  value={condition.operator}
                  onChange={(e) =>
                    handleUpdateCondition(index, 'operator', e.target.value as ConditionOperator)
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value */}
              {!['is_null', 'is_not_null'].includes(condition.operator) && (
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">القيمة</label>
                  <input
                    type="text"
                    value={condition.value as string}
                    onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                    placeholder="القيمة المطلوبة"
                    className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Remove Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRemoveCondition(index)}
                className="mt-5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                title="حذف الشرط"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Condition Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddCondition}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        إضافة شرط
      </Button>
    </div>
  );
}
