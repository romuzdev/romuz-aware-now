/**
 * GRC Control Library Page
 * Main page for managing control library
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { useControls, useCreateControl, type ControlFilters } from '@/modules/grc';
import { ControlForm } from '../components/ControlForm';
import { useAppContext } from '@/lib/app-context/AppContextProvider';

export function ControlLibrary() {
  const navigate = useNavigate();
  const { tenantId } = useAppContext();
  const [filters, setFilters] = useState<ControlFilters>({ sortBy: 'control_code', sortDir: 'asc' });
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: controls, isLoading } = useControls(filters);
  const createControl = useCreateControl();

  const handleCreate = async (data: any) => {
    await createControl.mutateAsync({ ...data, tenant_id: tenantId });
    setShowCreateDialog(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      draft: 'secondary',
      active: 'default',
      inactive: 'secondary',
      retired: 'destructive',
    };
    const labels: Record<string, string> = {
      draft: 'مسودة',
      active: 'نشط',
      inactive: 'غير نشط',
      retired: 'متقاعد',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getEffectivenessBadge = (rating: string | null) => {
    if (!rating) return <Badge variant="secondary">لم يتم الاختبار</Badge>;
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      not_tested: 'secondary',
      ineffective: 'destructive',
      partially_effective: 'secondary',
      effective: 'default',
      highly_effective: 'default',
    };
    const labels: Record<string, string> = {
      not_tested: 'لم يتم الاختبار',
      ineffective: 'غير فعال',
      partially_effective: 'فعال جزئياً',
      effective: 'فعال',
      highly_effective: 'فعال جداً',
    };
    return <Badge variant={variants[rating]}>{labels[rating]}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مكتبة الرقابة</h1>
          <p className="text-muted-foreground">إدارة ومتابعة الضوابط الرقابية</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة رقابة
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الرقابة..."
              className="pr-9"
              value={filters.q || ''}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
        </div>

        <Select
          value={filters.control_type}
          onValueChange={(value) =>
            setFilters({ ...filters, control_type: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="نوع الرقابة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="preventive">وقائية</SelectItem>
            <SelectItem value="detective">كاشفة</SelectItem>
            <SelectItem value="corrective">تصحيحية</SelectItem>
            <SelectItem value="directive">توجيهية</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.control_status}
          onValueChange={(value) =>
            setFilters({ ...filters, control_status: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
            <SelectItem value="retired">متقاعد</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>العنوان</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>التصنيف</TableHead>
              <TableHead>الفعالية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>آخر اختبار</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {controls?.map((control) => (
              <TableRow
                key={control.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/grc/controls/${control.id}`)}
              >
                <TableCell className="font-medium">{control.control_code}</TableCell>
                <TableCell>{control.control_title}</TableCell>
                <TableCell>
                  {control.control_type === 'preventive' && 'وقائية'}
                  {control.control_type === 'detective' && 'كاشفة'}
                  {control.control_type === 'corrective' && 'تصحيحية'}
                  {control.control_type === 'directive' && 'توجيهية'}
                </TableCell>
                <TableCell>
                  {control.control_category === 'access_control' && 'التحكم في الوصول'}
                  {control.control_category === 'data_protection' && 'حماية البيانات'}
                  {control.control_category === 'physical_security' && 'الأمن المادي'}
                  {control.control_category === 'operational' && 'تشغيلية'}
                  {control.control_category === 'technical' && 'تقنية'}
                  {control.control_category === 'administrative' && 'إدارية'}
                  {control.control_category === 'compliance' && 'الامتثال'}
                </TableCell>
                <TableCell>{getEffectivenessBadge(control.effectiveness_rating)}</TableCell>
                <TableCell>{getStatusBadge(control.control_status)}</TableCell>
                <TableCell>
                  {control.last_test_date
                    ? new Date(control.last_test_date).toLocaleDateString('ar-SA')
                    : 'لا يوجد'}
                </TableCell>
              </TableRow>
            ))}
            {controls?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  لا توجد ضوابط رقابية
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة رقابة جديدة</DialogTitle>
          </DialogHeader>
          <ControlForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
            isSubmitting={createControl.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
