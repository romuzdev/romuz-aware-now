/**
 * Rule Builder Component
 * 
 * بناء وتحرير قواعد الأتمتة
 */

import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { ConditionBuilder } from './ConditionBuilder';
import { ActionConfigurator } from './ActionConfigurator';
import type { AutomationRule, RuleConditions, RuleAction } from '@/lib/events/event.types';
import { COMMON_EVENT_TYPES } from '@/lib/events/event.types';

interface RuleBuilderProps {
  rule?: AutomationRule | null;
  onSave: (rule: Partial<AutomationRule>) => void;
  onCancel: () => void;
}

export function RuleBuilder({ rule, onSave, onCancel }: RuleBuilderProps) {
  const [ruleName, setRuleName] = useState(rule?.rule_name || '');
  const [description, setDescription] = useState(rule?.description_ar || '');
  const [triggerEvents, setTriggerEvents] = useState<string[]>(rule?.trigger_event_types || []);
  const [conditions, setConditions] = useState<RuleConditions>(
    rule?.conditions || { logic: 'AND', rules: [] }
  );
  const [actions, setActions] = useState<RuleAction[]>(rule?.actions || []);
  const [isEnabled, setIsEnabled] = useState(rule?.is_enabled ?? true);
  const [priority, setPriority] = useState(rule?.priority || 1);
  const [executionMode, setExecutionMode] = useState<'immediate' | 'scheduled'>(
    (rule?.execution_mode as 'immediate' | 'scheduled') || 'immediate'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ruleName.trim()) {
      alert('يرجى إدخال اسم القاعدة');
      return;
    }

    if (triggerEvents.length === 0) {
      alert('يرجى اختيار حدث محفز واحد على الأقل');
      return;
    }

    if (actions.length === 0) {
      alert('يرجى إضافة إجراء واحد على الأقل');
      return;
    }

    onSave({
      id: rule?.id,
      rule_name: ruleName,
      description_ar: description,
      trigger_event_types: triggerEvents,
      conditions,
      actions,
      is_enabled: isEnabled,
      priority,
      execution_mode: executionMode,
    });
  };

  const handleToggleEvent = (eventType: string) => {
    setTriggerEvents((prev) =>
      prev.includes(eventType)
        ? prev.filter((e) => e !== eventType)
        : [...prev, eventType]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات القاعدة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rule Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              اسم القاعدة *
            </label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="مثال: تنبيه عند فشل الحملة"
              className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              الوصف
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للقاعدة..."
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Enabled */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-foreground cursor-pointer">
                مفعّلة
              </label>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                الأولوية
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Execution Mode */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                نمط التنفيذ
              </label>
              <select
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value as 'immediate' | 'scheduled')}
                className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="immediate">فوري</option>
                <option value="scheduled">مجدول</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trigger Events */}
      <Card>
        <CardHeader>
          <CardTitle>الأحداث المحفّزة *</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            اختر الأحداث التي ستحفز تنفيذ هذه القاعدة
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(COMMON_EVENT_TYPES).map(([key, eventType]) => (
              <label
                key={key}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={triggerEvents.includes(eventType)}
                  onChange={() => handleToggleEvent(eventType)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-foreground">{eventType}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>الشروط</CardTitle>
        </CardHeader>
        <CardContent>
          <ConditionBuilder conditions={conditions} onChange={setConditions} />
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>الإجراءات *</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionConfigurator actions={actions} onChange={setActions} />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="gap-2">
          <X className="h-4 w-4" />
          إلغاء
        </Button>
        <Button type="submit" className="gap-2">
          <Save className="h-4 w-4" />
          حفظ القاعدة
        </Button>
      </div>
    </form>
  );
}
