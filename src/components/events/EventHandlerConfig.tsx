/**
 * Week 9-10: Event Handler Configuration Component
 * 
 * Configure actions to execute when events are triggered
 */

import { useState } from 'react';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { Plus, Trash2, Settings, Zap } from 'lucide-react';
import type { RuleAction, ActionType } from '@/lib/events';

interface EventHandlerConfigProps {
  actions: RuleAction[];
  onActionsChange: (actions: RuleAction[]) => void;
}

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  enroll_in_course: 'تسجيل في دورة',
  send_notification: 'إرسال إشعار',
  send_email: 'إرسال بريد إلكتروني',
  create_action_plan: 'إنشاء خطة عمل',
  update_kpi: 'تحديث مؤشر أداء',
  update_record: 'تحديث سجل',
  trigger_campaign: 'تشغيل حملة',
  trigger_workflow: 'تشغيل سير عمل',
  create_task: 'إنشاء مهمة',
  log_event: 'تسجيل حدث',
  call_webhook: 'استدعاء Webhook',
};

const ACTION_TYPE_ICONS: Record<ActionType, string> = {
  enroll_in_course: '🎓',
  send_notification: '🔔',
  send_email: '📧',
  create_action_plan: '📋',
  update_kpi: '📊',
  update_record: '📝',
  trigger_campaign: '📢',
  trigger_workflow: '🔄',
  create_task: '✅',
  log_event: '📋',
  call_webhook: '🔗',
};

export function EventHandlerConfig({ 
  actions, 
  onActionsChange 
}: EventHandlerConfigProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addAction = () => {
    const newAction: RuleAction = {
      action_type: 'send_notification',
      config: {
        title: '',
        message: '',
      },
    };
    onActionsChange([...actions, newAction]);
    setEditingIndex(actions.length);
  };

  const removeAction = (index: number) => {
    onActionsChange(actions.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onActionsChange(newActions);
  };

  const getActionTypeConfig = (actionType: ActionType) => {
    switch (actionType) {
      case 'enroll_in_course':
        return {
          fields: [
            { key: 'course_id', label: 'معرف الدورة', type: 'text', required: true },
            { key: 'user_id', label: 'معرف المستخدم', type: 'text' },
            { key: 'due_date', label: 'تاريخ الإنجاز المتوقع', type: 'text' },
          ],
        };
      case 'send_notification':
        return {
          fields: [
            { key: 'title', label: 'العنوان', type: 'text', required: true },
            { key: 'message', label: 'الرسالة', type: 'textarea', required: true },
            { key: 'priority', label: 'الأولوية', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
          ],
        };
      case 'send_email':
        return {
          fields: [
            { key: 'to', label: 'إلى', type: 'text', required: true },
            { key: 'subject', label: 'الموضوع', type: 'text', required: true },
            { key: 'body', label: 'المحتوى', type: 'textarea', required: true },
            { key: 'cc', label: 'نسخة إلى', type: 'text' },
          ],
        };
      case 'create_action_plan':
        return {
          fields: [
            { key: 'title', label: 'عنوان الخطة', type: 'text', required: true },
            { key: 'description', label: 'الوصف', type: 'textarea' },
            { key: 'policy_id', label: 'معرف السياسة', type: 'text' },
            { key: 'due_date', label: 'تاريخ الاستحقاق', type: 'text' },
          ],
        };
      case 'update_kpi':
        return {
          fields: [
            { key: 'kpi_id', label: 'معرف المؤشر', type: 'text', required: true },
            { key: 'value', label: 'القيمة', type: 'text', required: true },
            { key: 'notes', label: 'ملاحظات', type: 'textarea' },
          ],
        };
      case 'trigger_campaign':
        return {
          fields: [
            { key: 'campaign_id', label: 'معرف الحملة', type: 'text', required: true },
            { key: 'start_immediately', label: 'بدء فوري', type: 'select', options: ['true', 'false'] },
          ],
        };
      case 'create_task':
        return {
          fields: [
            { key: 'title', label: 'عنوان المهمة', type: 'text', required: true },
            { key: 'description', label: 'الوصف', type: 'textarea' },
            { key: 'assigned_to', label: 'مسند إلى', type: 'text' },
            { key: 'due_date', label: 'تاريخ الاستحقاق', type: 'text' },
          ],
        };
      case 'update_record':
        return {
          fields: [
            { key: 'table_name', label: 'اسم الجدول', type: 'text', required: true },
            { key: 'record_id', label: 'معرف السجل', type: 'text', required: true },
            { key: 'updates', label: 'التحديثات (JSON)', type: 'textarea', required: true },
          ],
        };
      case 'trigger_workflow':
        return {
          fields: [
            { key: 'workflow_id', label: 'معرف سير العمل', type: 'text', required: true },
            { key: 'parameters', label: 'المعاملات (JSON)', type: 'textarea' },
          ],
        };
      case 'log_event':
        return {
          fields: [
            { key: 'log_level', label: 'مستوى السجل', type: 'select', options: ['info', 'warning', 'error'] },
            { key: 'message', label: 'الرسالة', type: 'text', required: true },
          ],
        };
      case 'call_webhook':
        return {
          fields: [
            { key: 'url', label: 'URL', type: 'text', required: true },
            { key: 'method', label: 'الطريقة', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] },
            { key: 'headers', label: 'الرؤوس (JSON)', type: 'textarea' },
            { key: 'body', label: 'المحتوى (JSON)', type: 'textarea' },
          ],
        };
      default:
        return {
          fields: [
            { key: 'config', label: 'التكوين (JSON)', type: 'textarea', required: true },
          ],
        };
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">الإجراءات التلقائية</h3>
          </div>
          <Button onClick={addAction} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة إجراء
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          حدد الإجراءات التي سيتم تنفيذها تلقائياً عند تشغيل القاعدة
        </p>

        {/* Actions List */}
        {actions.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Zap className="h-12 w-12 opacity-20" />
              <p>لم يتم إضافة إجراءات بعد</p>
              <Button onClick={addAction} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة أول إجراء
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {actions.map((action, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  {/* Action Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {ACTION_TYPE_ICONS[action.action_type as ActionType]}
                      </span>
                      <div>
                        <div className="font-medium">
                          {ACTION_TYPE_LABELS[action.action_type as ActionType]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          إجراء #{index + 1}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                      >
                        {editingIndex === index ? 'إخفاء' : 'تعديل'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAction(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Configuration */}
                  {editingIndex === index && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        {/* Action Type Selector */}
                        <div className="space-y-2">
                          <Label>نوع الإجراء</Label>
                          <Select
                            value={action.action_type}
                            onValueChange={(value) => 
                              updateAction(index, { action_type: value as ActionType, config: {} })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  <span className="flex items-center gap-2">
                                    <span>{ACTION_TYPE_ICONS[value as ActionType]}</span>
                                    <span>{label}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Dynamic Configuration Fields */}
                        {getActionTypeConfig(action.action_type as ActionType)?.fields.map(field => (
                          <div key={field.key} className="space-y-2">
                            <Label>
                              {field.label}
                              {field.required && <span className="text-destructive">*</span>}
                            </Label>
                            {field.type === 'textarea' ? (
                              <Textarea
                                value={action.config[field.key] || ''}
                                onChange={(e) => 
                                  updateAction(index, {
                                    config: { ...action.config, [field.key]: e.target.value }
                                  })
                                }
                                placeholder={`أدخل ${field.label}`}
                                rows={3}
                              />
                            ) : field.type === 'select' ? (
                              <Select
                                value={action.config[field.key] || ''}
                                onValueChange={(value) =>
                                  updateAction(index, {
                                    config: { ...action.config, [field.key]: value }
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`اختر ${field.label}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map(option => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={action.config[field.key] || ''}
                                onChange={(e) =>
                                  updateAction(index, {
                                    config: { ...action.config, [field.key]: e.target.value }
                                  })
                                }
                                placeholder={`أدخل ${field.label}`}
                              />
                            )}
                          </div>
                        ))}

                        {/* Help Text */}
                        <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
                          <p>💡 يمكنك استخدام متغيرات الحدث في الحقول: {'{{event.payload.field_name}}'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
