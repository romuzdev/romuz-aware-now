/**
 * Action Configurator Component
 * 
 * تكوين الإجراءات التلقائية
 */

import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import type { RuleAction, ActionType } from '@/lib/events/event.types';

interface ActionConfiguratorProps {
  actions: RuleAction[];
  onChange: (actions: RuleAction[]) => void;
}

const ACTION_TYPES: { value: ActionType; label: string; description: string }[] = [
  {
    value: 'send_notification',
    label: 'إرسال إشعار',
    description: 'إرسال إشعار داخل التطبيق',
  },
  {
    value: 'enroll_in_course',
    label: 'تسجيل في دورة',
    description: 'تسجيل المستخدم في دورة تدريبية',
  },
  {
    value: 'create_action_plan',
    label: 'إنشاء خطة عمل',
    description: 'إنشاء خطة عمل تصحيحية تلقائياً',
  },
  {
    value: 'update_kpi',
    label: 'تحديث مؤشر أداء',
    description: 'تحديث قيمة مؤشر أداء',
  },
  {
    value: 'trigger_campaign',
    label: 'تفعيل حملة',
    description: 'تفعيل حملة توعية',
  },
  {
    value: 'create_task',
    label: 'إنشاء مهمة',
    description: 'إنشاء مهمة جديدة',
  },
  {
    value: 'call_webhook',
    label: 'استدعاء Webhook',
    description: 'إرسال بيانات إلى خدمة خارجية',
  },
];

export function ActionConfigurator({ actions, onChange }: ActionConfiguratorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAddAction = () => {
    const newAction: RuleAction = {
      action_type: 'send_notification',
      config: {},
    };

    onChange([...actions, newAction]);
    setExpandedIndex(actions.length);
  };

  const handleRemoveAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdateAction = (index: number, field: keyof RuleAction, value: any) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleUpdateConfig = (index: number, key: string, value: any) => {
    const updated = [...actions];
    updated[index] = {
      ...updated[index],
      config: {
        ...updated[index].config,
        [key]: value,
      },
    };
    onChange(updated);
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const renderConfigFields = (action: RuleAction, index: number) => {
    const commonFields = (
      <>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">العنوان</label>
          <input
            type="text"
            value={(action.config.title as string) || ''}
            onChange={(e) => handleUpdateConfig(index, 'title', e.target.value)}
            placeholder="العنوان"
            className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">الرسالة</label>
          <textarea
            value={(action.config.message as string) || ''}
            onChange={(e) => handleUpdateConfig(index, 'message', e.target.value)}
            placeholder="الرسالة (يمكن استخدام {{variable}})"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </>
    );

    switch (action.action_type) {
      case 'send_notification':
        return (
          <div className="space-y-3">
            {commonFields}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">الأولوية</label>
              <select
                value={(action.config.priority as string) || 'medium'}
                onChange={(e) => handleUpdateConfig(index, 'priority', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="critical">حرجة</option>
              </select>
            </div>
          </div>
        );

      case 'enroll_in_course':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">معرف الدورة</label>
              <input
                type="text"
                value={(action.config.course_id as string) || ''}
                onChange={(e) => handleUpdateConfig(index, 'course_id', e.target.value)}
                placeholder="course-123"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">معرف المستخدم</label>
              <input
                type="text"
                value={(action.config.user_id as string) || ''}
                onChange={(e) => handleUpdateConfig(index, 'user_id', e.target.value)}
                placeholder="يمكن استخدام {{user_id}}"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        );

      case 'create_action_plan':
        return (
          <div className="space-y-3">
            {commonFields}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">الأولوية</label>
              <select
                value={(action.config.priority as string) || 'medium'}
                onChange={(e) => handleUpdateConfig(index, 'priority', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="critical">حرجة</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">المسؤول</label>
              <input
                type="text"
                value={(action.config.assignee as string) || ''}
                onChange={(e) => handleUpdateConfig(index, 'assignee', e.target.value)}
                placeholder="معرّف المستخدم المسؤول"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        );

      case 'update_kpi':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">معرف المؤشر</label>
              <input
                type="text"
                value={(action.config.kpi_id as string) || ''}
                onChange={(e) => handleUpdateConfig(index, 'kpi_id', e.target.value)}
                placeholder="kpi-123"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">القيمة الجديدة</label>
              <input
                type="text"
                value={(action.config.value as string) || ''}
                onChange={(e) => handleUpdateConfig(index, 'value', e.target.value)}
                placeholder="يمكن استخدام {{payload.value}}"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        );

      case 'trigger_campaign':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">معرف الحملة</label>
              <input
                type="text"
                value={(action.config.campaign_id as string) || ''}
                onChange={(e) => handleUpdateConfig(index, 'campaign_id', e.target.value)}
                placeholder="campaign-123"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        );

      case 'create_task':
        return (
          <div className="space-y-3">
            {commonFields}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">المسؤول</label>
              <input
                type="text"
                value={(action.config.assignee as string) || ''}
                onChange={(e) => handleUpdateConfig(index, 'assignee', e.target.value)}
                placeholder="معرّف المستخدم المسؤول"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">تاريخ الاستحقاق</label>
              <input
                type="date"
                value={(action.config.due_date as string) || ''}
                onChange={(e) => handleUpdateConfig(index, 'due_date', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        );

      case 'call_webhook':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">URL</label>
              <input
                type="url"
                value={(action.config.url as string) || ''}
                onChange={(e) => handleUpdateConfig(index, 'url', e.target.value)}
                placeholder="https://api.example.com/webhook"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Method</label>
              <select
                value={(action.config.method as string) || 'POST'}
                onChange={(e) => handleUpdateConfig(index, 'method', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">التكوين (JSON)</label>
              <textarea
                value={JSON.stringify(action.config, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleUpdateAction(index, 'config', parsed);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                rows={5}
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {actions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          لا توجد إجراءات. يرجى إضافة إجراء واحد على الأقل.
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div key={index} className="border border-border rounded-md overflow-hidden">
              {/* Action Header */}
              <div className="flex items-center justify-between p-4 bg-muted/30">
                <div className="flex items-center gap-3 flex-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(index)}
                    className="p-0 h-auto"
                  >
                    {expandedIndex === index ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <select
                      value={action.action_type}
                      onChange={(e) =>
                        handleUpdateAction(index, 'action_type', e.target.value as ActionType)
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {ACTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ACTION_TYPES.find((t) => t.value === action.action_type)?.description}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAction(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  title="حذف الإجراء"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Action Config (Expanded) */}
              {expandedIndex === index && (
                <div className="p-4 border-t border-border">
                  {renderConfigFields(action, index)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Action Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddAction}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        إضافة إجراء
      </Button>
    </div>
  );
}
