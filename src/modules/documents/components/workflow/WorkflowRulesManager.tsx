/**
 * Workflow Rules Manager Component
 * 
 * Manages document workflow automation rules
 */

import { useState } from 'react';
import { Plus, Play, Pause, Trash2, Edit, AlertCircle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import {
  useWorkflowRules,
  useDeleteWorkflowRule,
  useToggleWorkflowRule,
} from '../../hooks/useDocumentWorkflows';
import { WorkflowRuleDialog } from './WorkflowRuleDialog';
import type { WorkflowRule } from '../../integration/workflow-automation.integration';

interface WorkflowRulesManagerProps {
  appCode?: string | null;
}

export function WorkflowRulesManager({ appCode }: WorkflowRulesManagerProps = {}) {
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

  const { data: rules = [], isLoading } = useWorkflowRules(appCode);
  const deleteRule = useDeleteWorkflowRule();
  const toggleRule = useToggleWorkflowRule();

  const handleCreate = () => {
    setSelectedRule(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (rule: WorkflowRule) => {
    setSelectedRule(rule);
    setIsDialogOpen(true);
  };

  const handleToggle = (ruleId: string, currentState: boolean) => {
    toggleRule.mutate({ ruleId, enabled: !currentState });
  };

  const handleDelete = () => {
    if (deleteRuleId) {
      deleteRule.mutate(deleteRuleId, {
        onSuccess: () => setDeleteRuleId(null),
      });
    }
  };

  const getRuleTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      auto_approval: { label: 'موافقة تلقائية', variant: 'default' },
      expiration_alert: { label: 'تنبيه انتهاء', variant: 'secondary' },
      auto_tagging: { label: 'وسوم ذكية', variant: 'outline' },
      version_alert: { label: 'تنبيه إصدار', variant: 'default' },
    };
    const config = variants[type] || { label: type, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">جاري التحميل...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قواعد التشغيل الآلي</CardTitle>
              <CardDescription>إدارة قواعد سير العمل الآلي للوثائق</CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء قاعدة جديدة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">لا توجد قواعد محددة بعد</p>
              <Button onClick={handleCreate} variant="outline">
                <Plus className="h-4 w-4 ml-2" />
                إنشاء أول قاعدة
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم القاعدة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>عدد التنفيذ</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {rule.rule_name}
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      )}
                    </TableCell>
                    <TableCell>{getRuleTypeBadge(rule.rule_type)}</TableCell>
                    <TableCell>
                      {rule.is_enabled ? (
                        <Badge variant="default">مفعّل</Badge>
                      ) : (
                        <Badge variant="secondary">معطّل</Badge>
                      )}
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>{rule.execution_count}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggle(rule.id, rule.is_enabled)}
                        >
                          {rule.is_enabled ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteRuleId(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <WorkflowRuleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        rule={selectedRule}
      />

      <AlertDialog open={!!deleteRuleId} onOpenChange={() => setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه القاعدة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
