/**
 * Finding Tracker
 * M12: Track and manage audit findings with detailed workflow
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
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
import { Label } from '@/core/components/ui/label';
import { AlertCircle, CheckCircle2, Clock, Plus, Edit, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuditFindings } from '@/modules/grc/hooks/useAudits';
import { useRecordFinding, useUpdateFindingResolution } from '@/modules/grc/hooks/useAuditWorkflows';
import type { FindingSeverity, FindingStatus } from '@/modules/grc/types/audit.types';

interface FindingTrackerProps {
  auditId: string;
}

const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  critical: 'حرجة',
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة',
  informational: 'معلوماتية',
};

const SEVERITY_COLORS: Record<FindingSeverity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  informational: 'bg-gray-500',
};

const STATUS_LABELS: Record<FindingStatus, string> = {
  open: 'مفتوحة',
  in_progress: 'قيد المعالجة',
  resolved: 'تم الحل',
  verified: 'تم التحقق',
  accepted_risk: 'مخاطرة مقبولة',
  closed: 'مغلقة',
};

const STATUS_COLORS: Record<FindingStatus, string> = {
  open: 'border-red-500 text-red-700',
  in_progress: 'border-blue-500 text-blue-700',
  resolved: 'border-green-500 text-green-700',
  verified: 'border-green-600 text-green-800',
  accepted_risk: 'border-yellow-500 text-yellow-700',
  closed: 'border-gray-500 text-gray-700',
};

export function FindingTracker({ auditId }: FindingTrackerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [newFinding, setNewFinding] = useState({
    finding_type: 'deficiency',
    severity: 'medium' as FindingSeverity,
    finding_title: '',
    finding_description: '',
    recommendation: '',
    responsible_user_id: '',
    target_closure_date: '',
  });

  const { data: findings, isLoading } = useAuditFindings({ audit_id: auditId });
  const recordFindingMutation = useRecordFinding();
  const updateResolutionMutation = useUpdateFindingResolution();

  const filteredFindings = findings?.filter(f => {
    if (filterSeverity !== 'all' && f.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && f.finding_status !== filterStatus) return false;
    return true;
  }) || [];

  const handleAddFinding = async () => {
    await recordFindingMutation.mutateAsync({
      audit_id: auditId,
      ...newFinding,
    });
    setIsAddDialogOpen(false);
    setNewFinding({
      finding_type: 'deficiency',
      severity: 'medium',
      finding_title: '',
      finding_description: '',
      recommendation: '',
      responsible_user_id: '',
      target_closure_date: '',
    });
  };

  const handleUpdateStatus = async (findingId: string, newStatus: FindingStatus) => {
    await updateResolutionMutation.mutateAsync({
      findingId,
      resolution: { resolution_status: newStatus },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>متابعة نتائج التدقيق</CardTitle>
            <CardDescription>
              إدارة ومتابعة جميع النتائج والملاحظات
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة نتيجة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>تسجيل نتيجة تدقيق جديدة</DialogTitle>
                <DialogDescription>
                  أضف نتيجة أو ملاحظة من عملية التدقيق
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع النتيجة</Label>
                    <Select
                      value={newFinding.finding_type}
                      onValueChange={(v) => setNewFinding({ ...newFinding, finding_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deficiency">قصور</SelectItem>
                        <SelectItem value="observation">ملاحظة</SelectItem>
                        <SelectItem value="opportunity">فرصة تحسين</SelectItem>
                        <SelectItem value="non_compliance">عدم امتثال</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الخطورة</Label>
                    <Select
                      value={newFinding.severity}
                      onValueChange={(v) => setNewFinding({ ...newFinding, severity: v as FindingSeverity })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">حرجة</SelectItem>
                        <SelectItem value="high">عالية</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="informational">معلوماتية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>عنوان النتيجة</Label>
                  <Input
                    value={newFinding.finding_title}
                    onChange={(e) => setNewFinding({ ...newFinding, finding_title: e.target.value })}
                    placeholder="مثال: ضعف في ضوابط الوصول"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الوصف التفصيلي</Label>
                  <Textarea
                    value={newFinding.finding_description}
                    onChange={(e) => setNewFinding({ ...newFinding, finding_description: e.target.value })}
                    placeholder="اشرح النتيجة بالتفصيل..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>التوصية</Label>
                  <Textarea
                    value={newFinding.recommendation}
                    onChange={(e) => setNewFinding({ ...newFinding, recommendation: e.target.value })}
                    placeholder="التوصيات والإجراءات المقترحة..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الإغلاق المستهدف</Label>
                  <Input
                    type="date"
                    value={newFinding.target_closure_date}
                    onChange={(e) => setNewFinding({ ...newFinding, target_closure_date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleAddFinding}
                  disabled={!newFinding.finding_title || !newFinding.finding_description || recordFindingMutation.isPending}
                >
                  حفظ النتيجة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية حسب الخطورة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الخطورات</SelectItem>
                  <SelectItem value="critical">حرجة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="informational">معلوماتية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="open">مفتوحة</SelectItem>
                  <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                  <SelectItem value="resolved">تم الحل</SelectItem>
                  <SelectItem value="verified">تم التحقق</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي النتائج</p>
                    <p className="text-2xl font-bold">{findings?.length || 0}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">حرجة وعالية</p>
                    <p className="text-2xl font-bold text-red-600">
                      {findings?.filter(f => f.severity === 'critical' || f.severity === 'high').length || 0}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مفتوحة</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {findings?.filter(f => f.finding_status === 'open').length || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Findings Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الخطورة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإغلاق المستهدف</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFindings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد نتائج تدقيق
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFindings.map((finding) => (
                    <TableRow key={finding.id}>
                      <TableCell className="font-mono text-sm">
                        {finding.finding_code}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="font-medium">{finding.finding_title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {finding.finding_description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={SEVERITY_COLORS[finding.severity as FindingSeverity]}>
                          {SEVERITY_LABELS[finding.severity as FindingSeverity]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[finding.finding_status as FindingStatus]}>
                          {STATUS_LABELS[finding.finding_status as FindingStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {finding.target_closure_date ? (
                          format(new Date(finding.target_closure_date), 'dd/MM/yyyy', { locale: ar })
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={finding.finding_status}
                            onValueChange={(v) => handleUpdateStatus(finding.id, v as FindingStatus)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">مفتوحة</SelectItem>
                              <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                              <SelectItem value="resolved">تم الحل</SelectItem>
                              <SelectItem value="verified">تم التحقق</SelectItem>
                              <SelectItem value="closed">مغلقة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
