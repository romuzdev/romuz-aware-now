/**
 * KPI Target Manager
 * M14 Enhancement: Manage KPI targets and thresholds
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Target, Edit, Save, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { UnifiedKPI } from '../types/unified-kpis.types';

interface KPITargetManagerProps {
  kpis?: UnifiedKPI[];
  onUpdateTarget?: (kpiId: string, newTarget: number) => Promise<void>;
  className?: string;
}

interface EditingState {
  kpiId: string;
  newTarget: number;
}

export function KPITargetManager({ kpis = [], onUpdateTarget, className }: KPITargetManagerProps) {
  const [editingKpi, setEditingKpi] = useState<EditingState | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleStartEdit = (kpi: UnifiedKPI) => {
    setEditingKpi({
      kpiId: kpi.kpi_key,
      newTarget: kpi.target_value,
    });
    setIsDialogOpen(true);
  };

  const handleSaveTarget = async () => {
    if (!editingKpi) return;

    try {
      await onUpdateTarget?.(editingKpi.kpiId, editingKpi.newTarget);
      toast.success('تم تحديث الهدف بنجاح');
      setIsDialogOpen(false);
      setEditingKpi(null);
    } catch (error) {
      toast.error('فشل تحديث الهدف');
    }
  };

  const getAchievementStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return { variant: 'default' as const, label: 'تم التحقيق', icon: CheckCircle };
    if (percentage >= 80) return { variant: 'default' as const, label: 'على المسار', icon: TrendingUp };
    return { variant: 'destructive' as const, label: 'بحاجة إلى تحسين', icon: AlertTriangle };
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              إدارة أهداف المؤشرات
            </CardTitle>
            <CardDescription>
              تحديد وتعديل أهداف مؤشرات الأداء الرئيسية
            </CardDescription>
          </div>
          <Badge variant="outline">
            {kpis.length} مؤشر
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المؤشر</TableHead>
                <TableHead>الموديول</TableHead>
                <TableHead className="text-center">القيمة الحالية</TableHead>
                <TableHead className="text-center">الهدف</TableHead>
                <TableHead className="text-center">التقدم</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد مؤشرات متاحة
                  </TableCell>
                </TableRow>
              ) : (
                kpis.map((kpi) => {
                  const percentage = (kpi.current_value / kpi.target_value) * 100;
                  const status = getAchievementStatus(kpi.current_value, kpi.target_value);
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={kpi.kpi_key}>
                      <TableCell className="font-medium">
                        <div className="max-w-[200px]">
                          <p className="truncate">{kpi.kpi_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {kpi.metadata?.description || kpi.entity_name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{kpi.module}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {kpi.current_value.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-center">
                        {kpi.target_value.toFixed(0)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={Math.min(percentage, 100)} className="h-2" />
                          <p className="text-xs text-center text-muted-foreground">
                            {percentage.toFixed(0)}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(kpi)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Target Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل هدف المؤشر</DialogTitle>
              <DialogDescription>
                قم بتحديد القيمة المستهدفة الجديدة للمؤشر
              </DialogDescription>
            </DialogHeader>
            {editingKpi && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="target">الهدف الجديد</Label>
                  <Input
                    id="target"
                    type="number"
                    value={editingKpi.newTarget}
                    onChange={(e) =>
                      setEditingKpi({
                        ...editingKpi,
                        newTarget: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-sm font-medium">معاينة التغيير:</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">الهدف الحالي:</span>
                    <span className="font-medium">
                      {kpis.find(k => k.kpi_key === editingKpi.kpiId)?.target_value.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">الهدف الجديد:</span>
                    <span className="font-bold text-primary">
                      {editingKpi.newTarget.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveTarget}>
                <Save className="h-4 w-4 ml-2" />
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
