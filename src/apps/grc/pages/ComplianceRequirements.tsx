/**
 * GRC Compliance Requirements Page
 * Manage compliance requirements
 */

import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
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
import { useComplianceRequirements, type ComplianceRequirementFilters } from '@/modules/grc';

export default function ComplianceRequirements() {
  const [filters, setFilters] = useState<ComplianceRequirementFilters>({
    sortBy: 'requirement_code',
    sortDir: 'asc',
  });

  const { data: requirements, isLoading } = useComplianceRequirements(filters);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      compliant: 'default',
      partially_compliant: 'secondary',
      non_compliant: 'destructive',
      not_assessed: 'secondary',
      not_applicable: 'secondary',
    };
    const labels: Record<string, string> = {
      compliant: 'ممتثل',
      partially_compliant: 'ممتثل جزئياً',
      non_compliant: 'غير ممتثل',
      not_assessed: 'لم يُقيّم',
      not_applicable: 'غير قابل للتطبيق',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'secondary',
    };
    const labels: Record<string, string> = {
      critical: 'حرج',
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
    };
    return <Badge variant={variants[priority]}>{labels[priority]}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المتطلبات التنظيمية</h1>
          <p className="text-muted-foreground">إدارة ومتابعة متطلبات الامتثال</p>
        </div>
        <Button>
          <Plus className="ml-2 h-4 w-4" />
          إضافة متطلب
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="بحث في المتطلبات..."
              value={filters.q || ''}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className="max-w-sm"
            />
          </div>
          <Select
            value={filters.compliance_status}
            onValueChange={(value) =>
              setFilters({ ...filters, compliance_status: value as any })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="حالة الامتثال" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compliant">ممتثل</SelectItem>
              <SelectItem value="partially_compliant">ممتثل جزئياً</SelectItem>
              <SelectItem value="non_compliant">غير ممتثل</SelectItem>
              <SelectItem value="not_assessed">لم يُقيّم</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.priority}
            onValueChange={(value) =>
              setFilters({ ...filters, priority: value as any })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="الأولوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">حرج</SelectItem>
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
              <TableHead>الرمز</TableHead>
              <TableHead>العنوان</TableHead>
              <TableHead>الإطار</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead>الأولوية</TableHead>
              <TableHead>حالة الامتثال</TableHead>
              <TableHead>آخر تقييم</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requirements && requirements.length > 0 ? (
              requirements.map((req) => (
                <TableRow key={req.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{req.requirement_code}</TableCell>
                  <TableCell className="font-medium">
                    {req.requirement_title_ar || req.requirement_title}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {req.framework_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{req.category}</Badge>
                  </TableCell>
                  <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                  <TableCell>{getStatusBadge(req.compliance_status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {req.last_assessment_date
                      ? new Date(req.last_assessment_date).toLocaleDateString('ar-SA')
                      : 'لم يُقيّم'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  لا توجد متطلبات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
