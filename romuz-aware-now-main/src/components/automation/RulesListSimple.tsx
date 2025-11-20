/**
 * Automation Rules List Component (Simplified)
 * 
 * عرض قائمة قواعد الأتمتة - نسخة مبسطة
 */

import { AutomationRule } from '@/lib/events/event.types';

interface RulesListProps {
  rules: AutomationRule[];
  onToggleRule: (ruleId: string, isEnabled: boolean) => void;
  onEditRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onCreateRule: () => void;
  isLoading?: boolean;
}

export function RulesList({
  rules,
  onToggleRule,
  onEditRule,
  onDeleteRule,
  onCreateRule,
  isLoading = false,
}: RulesListProps) {
  const getPriorityColor = (priority: number) => {
    if (priority >= 90) return 'bg-red-100 text-red-800 border-red-300';
    if (priority >= 70) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getExecutionModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      immediate: 'فوري',
      scheduled: 'مجدول',
      delayed: 'مؤجل',
    };
    return labels[mode] || mode;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">قواعد الأتمتة</h2>
          <p className="text-gray-600">إدارة قواعد التشغيل الآلي للأحداث</p>
        </div>
        <button
          onClick={onCreateRule}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          + قاعدة جديدة
        </button>
      </div>

      {/* Rules */}
      {rules.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">لا توجد قواعد أتمتة</h3>
          <p className="text-gray-600 mb-4">
            ابدأ بإنشاء قاعدة أتمتة لتشغيل الإجراءات تلقائياً
          </p>
          <button
            onClick={onCreateRule}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            إنشاء أول قاعدة
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Name & Toggle */}
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{rule.rule_name}</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.is_enabled}
                        onChange={(e) => onToggleRule(rule.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        rule.is_enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.is_enabled ? 'مفعّل' : 'معطّل'}
                    </span>
                  </div>

                  {/* Description */}
                  {rule.description_ar && (
                    <p className="text-sm text-gray-600">{rule.description_ar}</p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                        rule.priority
                      )}`}
                    >
                      أولوية: {rule.priority}
                    </span>
                    <span className="text-xs px-2 py-1 rounded border bg-gray-50">
                      {getExecutionModeLabel(rule.execution_mode)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded border bg-gray-50">
                      {rule.trigger_event_types.length} حدث
                    </span>
                    <span className="text-xs px-2 py-1 rounded border bg-gray-50">
                      {rule.actions.length} إجراء
                    </span>
                    {rule.execution_count > 0 && (
                      <span className="text-xs px-2 py-1 rounded border bg-blue-50 text-blue-800">
                        تم التنفيذ: {rule.execution_count} مرة
                      </span>
                    )}
                  </div>

                  {/* Last Executed */}
                  {rule.last_executed_at && (
                    <p className="text-xs text-gray-500">
                      آخر تنفيذ:{' '}
                      {new Date(rule.last_executed_at).toLocaleString('ar-SA')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditRule(rule.id)}
                    className="p-2 hover:bg-gray-100 rounded"
                    title="تعديل"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDeleteRule(rule.id)}
                    className="p-2 hover:bg-red-100 rounded text-red-600"
                    title="حذف"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
