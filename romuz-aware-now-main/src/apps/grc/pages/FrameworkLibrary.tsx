/**
 * GRC Framework Library Page
 * Main page for managing compliance frameworks
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, FileText } from 'lucide-react';
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
import { Progress } from '@/core/components/ui/progress';
import { Card } from '@/core/components/ui/card';
import { useComplianceFrameworks, type ComplianceFrameworkFilters } from '@/modules/grc';
import { useAppContext } from '@/lib/app-context/AppContextProvider';

export default function FrameworkLibrary() {
  const navigate = useNavigate();
  const { tenantId } = useAppContext();
  const [filters, setFilters] = useState<ComplianceFrameworkFilters>({ 
    sortBy: 'framework_code', 
    sortDir: 'asc' 
  });

  const { data: frameworks, isLoading } = useComplianceFrameworks(filters);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      deprecated: 'destructive',
      under_review: 'secondary',
    };
    const labels: Record<string, string> = {
      active: 'نشط',
      deprecated: 'متوقف',
      under_review: 'قيد المراجعة',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      regulatory: 'تنظيمي',
      industry_standard: 'معيار صناعي',
      best_practice: 'أفضل الممارسات',
      internal: 'داخلي',
    };
    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مكتبة أطر الامتثال</h1>
          <p className="text-muted-foreground">إدارة أطر الامتثال والمعايير التنظيمية</p>
        </div>
        <Button onClick={() => navigate('/grc/frameworks/new')}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة إطار
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">إجمالي الأطر</div>
          <div className="text-2xl font-bold">{frameworks?.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">أطر نشطة</div>
          <div className="text-2xl font-bold">
            {frameworks?.filter(f => f.framework_status === 'active').length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">متوسط الامتثال</div>
          <div className="text-2xl font-bold text-green-600">
            {frameworks && frameworks.length > 0
              ? Math.round(
                  frameworks.reduce((sum, f) => sum + (f.overall_compliance_score || 0), 0) /
                    frameworks.length
                )
              : 0}
            %
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">إجمالي المتطلبات</div>
          <div className="text-2xl font-bold">
            {frameworks?.reduce((sum, f) => sum + (f.total_requirements || 0), 0) || 0}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الأطر..."
              className="pr-9"
              value={filters.q || ''}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
        </div>

        <Select
          value={filters.framework_type}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              framework_type: value === 'all' ? undefined : (value as any),
            })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="regulatory">تنظيمي</SelectItem>
            <SelectItem value="industry_standard">معيار صناعي</SelectItem>
            <SelectItem value="best_practice">أفضل الممارسات</SelectItem>
            <SelectItem value="internal">داخلي</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.framework_status}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              framework_status: value === 'all' ? undefined : (value as any),
            })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="deprecated">متوقف</SelectItem>
            <SelectItem value="under_review">قيد المراجعة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Frameworks Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>اسم الإطار</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>المتطلبات</TableHead>
              <TableHead>نسبة الامتثال</TableHead>
              <TableHead>الإصدار</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {frameworks && frameworks.length > 0 ? (
              frameworks.map((framework) => (
                <TableRow
                  key={framework.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/grc/frameworks/${framework.id}`)}
                >
                  <TableCell className="font-mono font-medium">
                    {framework.framework_code}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{framework.framework_name}</div>
                      {framework.framework_name_ar && (
                        <div className="text-sm text-muted-foreground">
                          {framework.framework_name_ar}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(framework.framework_type)}</TableCell>
                  <TableCell>{getStatusBadge(framework.framework_status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{framework.total_requirements || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getComplianceColor(framework.overall_compliance_score || 0)}`}>
                          {Math.round(framework.overall_compliance_score || 0)}%
                        </span>
                      </div>
                      <Progress 
                        value={framework.overall_compliance_score || 0} 
                        className="h-1.5 w-24"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {framework.framework_version || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/grc/frameworks/${framework.id}`);
                      }}
                    >
                      عرض
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  لا توجد أطر متاحة
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
