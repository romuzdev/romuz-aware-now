/**
 * GRC Compliance Gaps Page
 * Manage and track compliance gaps
 */

import { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Card } from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { useComplianceGaps, type ComplianceGapFilters } from '@/modules/grc';

export default function ComplianceGaps() {
  const [filters, setFilters] = useState<ComplianceGapFilters>({
    sortBy: 'identified_date',
    sortDir: 'desc',
  });

  const { data: gaps, isLoading } = useComplianceGaps(filters);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      open: 'destructive',
      in_progress: 'default',
      remediated: 'default',
      accepted: 'secondary',
      mitigated: 'secondary',
      closed: 'secondary',
    };
    const labels: Record<string, string> = {
      open: 'مفتوحة',
      in_progress: 'قيد المعالجة',
      remediated: 'تم المعالجة',
      accepted: 'مقبولة',
      mitigated: 'تم التخفيف',
      closed: 'مغلقة',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'secondary',
    };
    const labels: Record<string, string> = {
      critical: 'حرجة',
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
    };
    return <Badge variant={variants[severity]}>{labels[severity]}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  const criticalGaps = gaps?.filter(g => g.severity === 'critical').length || 0;
  const openGaps = gaps?.filter(g => g.gap_status === 'open').length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">فجوات الامتثال</h1>
          <p className="text-muted-foreground">تحديد ومعالجة فجوات الامتثال</p>
        </div>
        <Button>
          <Plus className="ml-2 h-4 w-4" />
          إضافة فجوة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-muted-foreground">فجوات حرجة</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{criticalGaps}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-muted-foreground">فجوات مفتوحة</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{openGaps}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">إجمالي الفجوات</span>
          </div>
          <div className="text-2xl font-bold">{gaps?.length || 0}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">تم المعالجة</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {gaps?.filter(g => g.gap_status === 'closed').length || 0}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="بحث في الفجوات..."
              value={filters.q || ''}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className="max-w-sm"
            />
          </div>
          <Select
            value={filters.gap_status}
            onValueChange={(value) =>
              setFilters({ ...filters, gap_status: value as any })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">مفتوحة</SelectItem>
              <SelectItem value="in_progress">قيد المعالجة</SelectItem>
              <SelectItem value="remediated">تم المعالجة</SelectItem>
              <SelectItem value="closed">مغلقة</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.severity}
            onValueChange={(value) =>
              setFilters({ ...filters, severity: value as any })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="الخطورة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">حرجة</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="low">منخفضة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العنوان</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الخطورة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الاكتشاف</TableHead>
              <TableHead>تاريخ الإغلاق المستهدف</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gaps && gaps.length > 0 ? (
              gaps.map((gap) => (
                <TableRow key={gap.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {gap.gap_title_ar || gap.gap_title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{gap.gap_type}</Badge>
                  </TableCell>
                  <TableCell>{getSeverityBadge(gap.severity)}</TableCell>
                  <TableCell>{getStatusBadge(gap.gap_status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {gap.identified_date
                      ? new Date(gap.identified_date).toLocaleDateString('ar-SA')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {gap.target_closure_date
                      ? new Date(gap.target_closure_date).toLocaleDateString('ar-SA')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  لا توجد فجوات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
