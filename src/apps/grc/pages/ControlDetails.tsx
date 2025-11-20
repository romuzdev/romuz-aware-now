/**
 * GRC Control Details Page
 * Detailed view and management of a single control
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
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
  useControlById,
  useUpdateControl,
  useDeleteControl,
  useCreateControlTest,
  useControlTests,
} from '@/modules/grc';
import { ControlForm } from '../components/ControlForm';
import { ControlTestForm } from '../components/ControlTestForm';

export function ControlDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);

  const { data: control, isLoading } = useControlById(id);
  const { data: tests } = useControlTests({ control_id: id });
  const updateControl = useUpdateControl();
  const deleteControl = useDeleteControl();
  const createTest = useCreateControlTest();

  const handleUpdate = async (data: any) => {
    if (!id) return;
    await updateControl.mutateAsync({ id, data });
    setShowEditDialog(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteControl.mutateAsync(id);
    navigate('/grc/controls');
  };

  const handleCreateTest = async (data: any) => {
    await createTest.mutateAsync(data);
    setShowTestDialog(false);
  };

  if (isLoading || !control) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/grc/controls')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{control.control_title}</h1>
            <p className="text-muted-foreground">{control.control_code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="ml-2 h-4 w-4" />
            حذف
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">النوع</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {control.control_type === 'preventive' && 'وقائية'}
              {control.control_type === 'detective' && 'كاشفة'}
              {control.control_type === 'corrective' && 'تصحيحية'}
              {control.control_type === 'directive' && 'توجيهية'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">الطبيعة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {control.control_nature === 'manual' && 'يدوية'}
              {control.control_nature === 'automated' && 'آلية'}
              {control.control_nature === 'hybrid' && 'مختلطة'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">الفعالية</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {!control.effectiveness_rating && 'لم يتم الاختبار'}
              {control.effectiveness_rating === 'ineffective' && 'غير فعال'}
              {control.effectiveness_rating === 'partially_effective' && 'فعال جزئياً'}
              {control.effectiveness_rating === 'effective' && 'فعال'}
              {control.effectiveness_rating === 'highly_effective' && 'فعال جداً'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">إجمالي الاختبارات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{control.total_tests || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">التفاصيل</TabsTrigger>
          <TabsTrigger value="tests">الاختبارات</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الرقابة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">الوصف</h3>
                <p className="text-muted-foreground">{control.control_description || 'لا يوجد'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">الهدف</h3>
                <p className="text-muted-foreground">{control.control_objective || 'لا يوجد'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">الإجراءات</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {control.control_procedures || 'لا يوجد'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">تكرار الاختبار</h3>
                  <p className="text-muted-foreground">
                    {control.testing_frequency === 'daily' && 'يومي'}
                    {control.testing_frequency === 'weekly' && 'أسبوعي'}
                    {control.testing_frequency === 'monthly' && 'شهري'}
                    {control.testing_frequency === 'quarterly' && 'ربع سنوي'}
                    {control.testing_frequency === 'annually' && 'سنوي'}
                    {control.testing_frequency === 'ad_hoc' && 'حسب الحاجة'}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">آخر اختبار</h3>
                  <p className="text-muted-foreground">
                    {control.last_test_date
                      ? new Date(control.last_test_date).toLocaleDateString('ar-SA')
                      : 'لا يوجد'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowTestDialog(true)}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة اختبار
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>النتيجة</TableHead>
                    <TableHead>الفعالية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests?.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">{test.test_code}</TableCell>
                      <TableCell>{test.test_title}</TableCell>
                      <TableCell>{new Date(test.test_date).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>
                        {test.test_type === 'design' && 'اختبار التصميم'}
                        {test.test_type === 'operating_effectiveness' && 'فعالية التشغيل'}
                        {test.test_type === 'compliance' && 'الامتثال'}
                        {test.test_type === 'walkthrough' && 'إجراء تفقدي'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            test.test_result === 'passed' ? 'default' : test.test_result === 'failed' ? 'destructive' : 'secondary'
                          }
                        >
                          {test.test_result === 'passed' && 'نجح'}
                          {test.test_result === 'passed_with_exceptions' && 'نجح مع استثناءات'}
                          {test.test_result === 'failed' && 'فشل'}
                          {test.test_result === 'not_applicable' && 'غير قابل للتطبيق'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {test.effectiveness_conclusion === 'effective' && 'فعال'}
                        {test.effectiveness_conclusion === 'partially_effective' && 'فعال جزئياً'}
                        {test.effectiveness_conclusion === 'ineffective' && 'غير فعال'}
                        {test.effectiveness_conclusion === 'not_determined' && 'غير محدد'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {tests?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        لا توجد اختبارات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الرقابة</DialogTitle>
          </DialogHeader>
          <ControlForm
            control={control}
            onSubmit={handleUpdate}
            onCancel={() => setShowEditDialog(false)}
            isSubmitting={updateControl.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة اختبار جديد</DialogTitle>
          </DialogHeader>
          <ControlTestForm
            controlId={control.id}
            onSubmit={handleCreateTest}
            onCancel={() => setShowTestDialog(false)}
            isSubmitting={createTest.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذه الرقابة بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
