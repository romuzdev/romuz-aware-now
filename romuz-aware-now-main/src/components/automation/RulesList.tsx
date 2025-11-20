/**
 * Automation Rules List Component
 * 
 * عرض قائمة قواعد الأتمتة
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, TestTube2, Trash2, Power, PowerOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import type { AutomationRule } from '@/lib/events/event.types';
import { 
  listAutomationRules, 
  toggleAutomationRule, 
  deleteAutomationRule 
} from '@/integrations/supabase/automation';
import { toast } from 'sonner';

interface RulesListProps {
  searchQuery?: string;
  filterEnabled?: boolean | null;
  onEdit: (rule: AutomationRule) => void;
  onTest: (rule: AutomationRule) => void;
}

// Backup mock data (only used if database is empty)
const backupMockRules: AutomationRule[] = [
  {
    id: '1',
    tenant_id: 'tenant-1',
    rule_name: 'تنبيه عند فشل الحملة',
    description_ar: 'إرسال تنبيه عندما تفشل حملة توعية',
    trigger_event_types: ['campaign:failed'],
    conditions: {
      logic: 'AND',
      rules: [
        { field: 'status', operator: 'eq', value: 'failed' },
      ],
    },
    actions: [
      {
        action_type: 'send_notification',
        config: {
          title: 'فشل الحملة',
          message: 'فشلت حملة {{campaign_name}}',
          priority: 'high',
        },
      },
    ],
    is_enabled: true,
    priority: 1,
    execution_mode: 'immediate',
    execution_count: 12,
    last_executed_at: '2024-01-15T10:30:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    tenant_id: 'tenant-1',
    rule_name: 'إنشاء إجراء تصحيحي تلقائي',
    description_ar: 'إنشاء إجراء تصحيحي عند اكتشاف مخالفة',
    trigger_event_types: ['policy:violation_detected'],
    conditions: {
      logic: 'AND',
      rules: [
        { field: 'severity', operator: 'eq', value: 'high' },
      ],
    },
    actions: [
      {
        action_type: 'create_action_plan',
        config: {
          title: 'معالجة مخالفة {{policy_name}}',
          priority: 'high',
        },
      },
      {
        action_type: 'send_notification',
        config: {
          title: 'مخالفة عالية الخطورة',
          message: 'تم اكتشاف مخالفة في {{policy_name}}',
          priority: 'high',
        },
      },
    ],
    is_enabled: true,
    priority: 2,
    execution_mode: 'immediate',
    execution_count: 8,
    last_executed_at: '2024-01-14T15:20:00Z',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-14T15:20:00Z',
  },
  {
    id: '3',
    tenant_id: 'tenant-1',
    rule_name: 'تقرير أسبوعي تلقائي',
    description_ar: 'إرسال تقرير أسبوعي بالإحصائيات',
    trigger_event_types: ['system:scheduled'],
    conditions: {
      logic: 'AND',
      rules: [],
    },
    actions: [
      {
        action_type: 'create_task',
        config: {
          title: 'إنشاء التقرير الأسبوعي',
          assignee: 'admin',
          due_date: '{{next_monday}}',
        },
      },
      {
        action_type: 'send_notification',
        config: {
          title: 'تذكير بالتقرير الأسبوعي',
          message: 'حان موعد إعداد التقرير الأسبوعي',
        },
      },
    ],
    is_enabled: false,
    priority: 3,
    execution_mode: 'scheduled',
    schedule_config: {
      cron: '0 9 * * 1', // كل اثنين الساعة 9 صباحاً
    },
    execution_count: 0,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
];

export function RulesList({ searchQuery = '', filterEnabled = null, onEdit, onTest }: RulesListProps) {
  const queryClient = useQueryClient();
  
  // Fetch rules from database
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automation-rules', searchQuery, filterEnabled],
    queryFn: () => listAutomationRules({
      search: searchQuery || undefined,
      is_enabled: filterEnabled === null ? undefined : filterEnabled,
    }),
    staleTime: 10000, // 10 seconds
  });
  
  // Toggle rule mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_enabled }: { id: string; is_enabled: boolean }) =>
      toggleAutomationRule(id, is_enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('تم تحديث حالة القاعدة');
    },
    onError: (error: any) => {
      toast.error(`فشل التحديث: ${error.message}`);
    },
  });
  
  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAutomationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('تم حذف القاعدة');
    },
    onError: (error: any) => {
      toast.error(`فشل الحذف: ${error.message}`);
    },
  });

  const [filteredRules, setFilteredRules] = useState<AutomationRule[]>([]);

  // Apply filters to rules (must be before early returns)
  useEffect(() => {
    let filtered = [...rules];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (rule) =>
          rule.rule_name.toLowerCase().includes(query) ||
          rule.description_ar?.toLowerCase().includes(query)
      );
    }

    // Enabled filter
    if (filterEnabled !== null) {
      filtered = filtered.filter((rule) => rule.is_enabled === filterEnabled);
    }

    setFilteredRules(filtered);
  }, [rules, searchQuery, filterEnabled]);

  const handleToggleEnabled = (ruleId: string, isEnabled: boolean) => {
    toggleMutation.mutate({ id: ruleId, is_enabled: isEnabled });
  };

  const handleDelete = (ruleId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه القاعدة؟')) {
      deleteMutation.mutate(ruleId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredRules.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">لا توجد قواعد</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredRules.map((rule) => (
        <Card key={rule.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl">{rule.rule_name}</CardTitle>
                  {rule.is_enabled ? (
                    <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs rounded-full font-medium">
                      مفعّلة
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-500/10 text-gray-600 dark:text-gray-400 text-xs rounded-full font-medium">
                      معطّلة
                    </span>
                  )}
                </div>
                {rule.description_ar && (
                  <p className="text-sm text-muted-foreground mt-2">{rule.description_ar}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleEnabled(rule.id, rule.is_enabled)}
                    disabled={toggleMutation.isPending}
                    title={rule.is_enabled ? 'تعطيل' : 'تفعيل'}
                  >
                    {rule.is_enabled ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                  </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTest(rule)}
                  title="اختبار"
                >
                  <TestTube2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(rule)}
                  title="تعديل"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(rule.id)}
                  disabled={deleteMutation.isPending}
                  title="حذف"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* Triggers */}
              <div>
                <p className="text-muted-foreground mb-2">الأحداث المحفّزة:</p>
                <div className="space-y-1">
                  {rule.trigger_event_types.map((type, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded mr-1 mb-1"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <p className="text-muted-foreground mb-2">الشروط:</p>
                <p className="text-foreground">
                  {rule.conditions.rules.length === 0
                    ? 'بدون شروط'
                    : `${rule.conditions.rules.length} شرط (${rule.conditions.logic})`}
                </p>
              </div>

              {/* Actions */}
              <div>
                <p className="text-muted-foreground mb-2">الإجراءات:</p>
                <p className="text-foreground">{rule.actions.length} إجراء</p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-6 text-xs text-muted-foreground">
              <span>عدد التنفيذات: {rule.execution_count || 0}</span>
              {rule.last_executed_at && (
                <span>آخر تنفيذ: {new Date(rule.last_executed_at).toLocaleString('ar-SA')}</span>
              )}
              <span>الأولوية: {rule.priority}</span>
              <span>النمط: {rule.execution_mode === 'immediate' ? 'فوري' : 'مجدول'}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
