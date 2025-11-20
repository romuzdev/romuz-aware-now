/**
 * Alert Policies List Component
 * Week 4 - Phase 2
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { AlertTriangle, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAlertPolicies } from '@/modules/alerts/hooks/useAlertPolicies';
import { AlertPolicyDialog } from './AlertPolicyDialog';
import type { AlertPolicy } from '@/modules/observability/types';

export function AlertPoliciesList() {
  const { policies, loading, deletePolicy, updatePolicy } = useAlertPolicies();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<AlertPolicy | null>(null);

  const handleEdit = (policy: AlertPolicy) => {
    setSelectedPolicy(policy);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPolicy(null);
    setDialogOpen(true);
  };

  const togglePolicy = (policy: AlertPolicy) => {
    updatePolicy({
      id: policy.id,
      data: { is_enabled: !policy.is_enabled },
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'destructive';
      case 'warn': return 'destructive';
      case 'info': return 'secondary';
      default: return 'secondary';
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
              <CardTitle>سياسات التنبيه</CardTitle>
              <CardDescription>
                إدارة قواعد التنبيهات والإشعارات التلقائية
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة سياسة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد سياسات تنبيه حالياً</p>
              </div>
            ) : (
              policies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{policy.name}</h4>
                      <Badge variant={getSeverityColor(policy.severity)}>
                        {policy.severity}
                      </Badge>
                      {policy.is_enabled ? (
                        <Badge variant="default">مفعّل</Badge>
                      ) : (
                        <Badge variant="secondary">معطّل</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {policy.metric} {policy.operator} {policy.threshold_value}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePolicy(policy)}
                    >
                      {policy.is_enabled ? (
                        <ToggleRight className="h-4 w-4 text-success" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(policy)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePolicy(policy.id)}
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

      <AlertPolicyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        policy={selectedPolicy}
      />
    </>
  );
}
