/**
 * Automation Rules List Component
 * Week 4 - Phase 4
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Zap, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Play } from 'lucide-react';
import { useAutomationRules } from '../hooks/useAutomation';
import { AutomationRuleDialog } from './AutomationRuleDialog';
import type { AutomationRule } from '../types/automation.types';

export function AutomationRulesList() {
  const { rules, loading, deleteRule, toggleRule, triggerRule } = useAutomationRules();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);

  const handleEdit = (rule: AutomationRule) => {
    setSelectedRule(rule);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedRule(null);
    setDialogOpen(true);
  };

  const handleToggle = (rule: AutomationRule) => {
    toggleRule({ id: rule.id, isEnabled: !rule.is_enabled });
  };

  const handleTrigger = (ruleId: string) => {
    triggerRule({ ruleId });
  };

  const getExecutionModeColor = (mode: string) => {
    switch (mode) {
      case 'immediate':
        return 'default';
      case 'scheduled':
        return 'secondary';
      case 'batch':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قواعد الأتمتة</CardTitle>
              <CardDescription>
                إدارة قواعد سير العمل التلقائية
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة قاعدة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد قواعد أتمتة حالياً</p>
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">{rule.rule_name}</h4>
                      <Badge variant={getExecutionModeColor(rule.execution_mode)}>
                        {rule.execution_mode === 'immediate' && 'فوري'}
                        {rule.execution_mode === 'scheduled' && 'مجدول'}
                        {rule.execution_mode === 'batch' && 'دفعي'}
                      </Badge>
                      {rule.is_enabled ? (
                        <Badge variant="default">مفعّل</Badge>
                      ) : (
                        <Badge variant="secondary">معطّل</Badge>
                      )}
                      <Badge variant="outline">أولوية: {rule.priority}</Badge>
                    </div>
                    
                    {rule.description_ar && (
                      <p className="text-sm text-muted-foreground">{rule.description_ar}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground">
                        الأحداث المحفزة:
                      </span>
                      {rule.trigger_event_types.map((event, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      عدد التنفيذات: {rule.execution_count || 0}
                      {rule.last_executed_at && (
                        <> • آخر تنفيذ: {new Date(rule.last_executed_at).toLocaleDateString('ar-SA')}</>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTrigger(rule.id)}
                      title="تشغيل يدوي"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(rule)}
                    >
                      {rule.is_enabled ? (
                        <ToggleRight className="h-4 w-4 text-primary" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AutomationRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={selectedRule}
      />
    </>
  );
}
