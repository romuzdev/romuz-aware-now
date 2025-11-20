/**
 * GRC Audits Page
 * Main page for managing audits
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { Card } from '@/core/components/ui/card';
import { useAudits, type AuditFilters } from '@/modules/grc';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function AuditsPage() {
  const navigate = useNavigate();
  const { tenantId } = useAppContext();
  const [filters, setFilters] = useState<AuditFilters>({ 
    sortBy: 'planned_start_date', 
    sortDir: 'desc' 
  });

  const { data: audits, isLoading } = useAudits(filters);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      planned: 'secondary',
      in_progress: 'default',
      fieldwork_complete: 'default',
      report_draft: 'secondary',
      report_final: 'default',
      closed: 'secondary',
    };
    const labels: Record<string, string> = {
      planned: 'مخطط',
      in_progress: 'قيد التنفيذ',
      fieldwork_complete: 'العمل الميداني مكتمل',
      report_draft: 'مسودة التقرير',
      report_final: 'التقرير النهائي',
      closed: 'مغلق',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      internal: 'داخلي',
      external: 'خارجي',
      compliance: 'امتثال',
      operational: 'تشغيلي',
      financial: 'مالي',
      it: 'تقنية',
    };
    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const getRatingBadge = (rating: string | null) => {
    if (!rating) return null;
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      satisfactory: 'default',
      needs_improvement: 'secondary',
      unsatisfactory: 'destructive',
    };
    const labels: Record<string, string> = {
      satisfactory: 'مُرضٍ',
      needs_improvement: 'يحتاج تحسين',
      unsatisfactory: 'غير مُرضٍ',
    };
    return <Badge variant={variants[rating]}>{labels[rating]}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">عمليات التدقيق</h1>
          <p className="text-muted-foreground">تخطيط ومتابعة عمليات التدقيق الداخلي والخارجي</p>
        </div>
        <Button onClick={() => navigate('/audit/audits/new')}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة تدقيق
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">إجمالي التدقيقات</div>
          <div className="text-2xl font-bold">{audits?.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">قيد التنفيذ</div>
          <div className="text-2xl font-bold text-blue-600">
            {audits?.filter(a => a.audit_status === 'in_progress').length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">مكتمل</div>
          <div className="text-2xl font-bold text-green-600">
            {audits?.filter(a => a.audit_status === 'closed').length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">إجمالي النتائج</div>
          <div className="text-2xl font-bold">
            {audits?.reduce((sum, a) => sum + (a.total_findings || 0), 0) || 0}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في التدقيقات..."
              className="pr-9"
              value={filters.q || ''}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
        </div>

        <Select
          value={filters.audit_type}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              audit_type: value === 'all' ? undefined : (value as any),
            })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="internal">داخلي</SelectItem>
            <SelectItem value="external">خارجي</SelectItem>
            <SelectItem value="compliance">امتثال</SelectItem>
            <SelectItem value="operational">تشغيلي</SelectItem>
            <SelectItem value="financial">مالي</SelectItem>
            <SelectItem value="it">تقنية</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.audit_status}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              audit_status: value === 'all' ? undefined : (value as any),
            })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="planned">مخطط</SelectItem>
            <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
            <SelectItem value="fieldwork_complete">العمل الميداني مكتمل</SelectItem>
            <SelectItem value="report_draft">مسودة التقرير</SelectItem>
            <SelectItem value="report_final">التقرير النهائي</SelectItem>
            <SelectItem value="closed">مغلق</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audits Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>عنوان التدقيق</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ البدء</TableHead>
              <TableHead>تاريخ الانتهاء</TableHead>
              <TableHead>النتائج</TableHead>
              <TableHead>التقييم</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits && audits.length > 0 ? (
              audits.map((audit) => (
                <TableRow
                  key={audit.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/audit/audits/${audit.id}`)}
                >
                  <TableCell className="font-mono font-medium">
                    {audit.audit_code}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{audit.audit_title}</div>
                      {audit.audit_title_ar && (
                        <div className="text-sm text-muted-foreground">
                          {audit.audit_title_ar}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(audit.audit_type)}</TableCell>
                  <TableCell>{getStatusBadge(audit.audit_status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {audit.actual_start_date 
                        ? format(new Date(audit.actual_start_date), 'dd/MM/yyyy', { locale: ar })
                        : format(new Date(audit.planned_start_date), 'dd/MM/yyyy', { locale: ar })
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {audit.actual_end_date 
                        ? format(new Date(audit.actual_end_date), 'dd/MM/yyyy', { locale: ar })
                        : format(new Date(audit.planned_end_date), 'dd/MM/yyyy', { locale: ar })
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div>الإجمالي: {audit.total_findings || 0}</div>
                      {audit.critical_findings > 0 && (
                        <div className="text-red-600">حرجة: {audit.critical_findings}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRatingBadge(audit.overall_rating)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/audit/audits/${audit.id}`);
                      }}
                    >
                      عرض
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  لا توجد عمليات تدقيق متاحة
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
