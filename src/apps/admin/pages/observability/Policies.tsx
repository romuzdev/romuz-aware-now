// ============================================================================
// Gate-E: Alert Policies Management Page
// ============================================================================

import { useState } from 'react';
import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { useAlertPolicies } from '@/features/observability/hooks/useAlertPolicies';
import { PolicyFormDialog } from '@/features/observability/components/PolicyFormDialog';
import { AlertPolicy } from '@/modules/observability';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
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
import { Skeleton } from '@/core/components/ui/skeleton';

export default function AlertPoliciesPage() {
  const { policies, loading, updatePolicy, deletePolicy } = useAlertPolicies();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AlertPolicy | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);

  const handleEdit = (policy: AlertPolicy) => {
    setEditingPolicy(policy);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setPolicyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (policyToDelete) {
      deletePolicy(policyToDelete);
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
    }
  };

  const toggleEnabled = (policy: AlertPolicy) => {
    updatePolicy({
      id: policy.id,
      data: { is_enabled: !policy.is_enabled },
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warn':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">سياسات التنبيهات</h1>
          <p className="text-muted-foreground mt-1">
            تحديد متى يتم إطلاق التنبيهات بناءً على مقاييس الأداء
          </p>
        </div>
        <Button onClick={() => { setEditingPolicy(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة سياسة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>السياسات المفعّلة</CardTitle>
          <CardDescription>
            {policies.filter(p => p.is_enabled).length} من {policies.length} سياسة نشطة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد سياسات مسجلة. أضف أول سياسة للبدء.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>المقياس</TableHead>
                  <TableHead>العتبة</TableHead>
                  <TableHead>الأهمية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {policy.metric}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {policy.operator} {policy.threshold_value}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(policy.severity)}>
                        {policy.severity === 'critical' ? 'حرج' : 
                         policy.severity === 'warn' ? 'تحذير' : 'معلومات'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={policy.is_enabled ? 'default' : 'secondary'}>
                        {policy.is_enabled ? 'مفعّل' : 'معطّل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEnabled(policy)}
                          title={policy.is_enabled ? 'تعطيل' : 'تفعيل'}
                        >
                          {policy.is_enabled ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(policy)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(policy.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <PolicyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        policy={editingPolicy}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه السياسة؟ سيتم إيقاف جميع التنبيهات المرتبطة بها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
