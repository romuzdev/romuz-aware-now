import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useKPI, useDeleteKPI, useKPITargets, useKPIReadings } from "@/modules/objectives";
import { KPIForm } from "@/modules/objectives/components/kpis/KPIForm";
import { KPIChart } from "@/modules/objectives/components/kpis/KPIChart";
import { TargetForm } from "@/modules/objectives/components/kpis/TargetForm";
import { ReadingForm } from "@/modules/objectives/components/kpis/ReadingForm";
import { KPIGuards } from "@/modules/objectives/integration/objectives-guards";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/ui/alert-dialog";

export default function KPIDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
  const [isReadingDialogOpen, setIsReadingDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: kpi, isLoading } = useKPI(id!);
  const { data: targets } = useKPITargets(id!);
  const { data: readings } = useKPIReadings(id!);
  const deleteMutation = useDeleteKPI();

  const canWrite = KPIGuards.canWrite();

  const handleDelete = () => {
    deleteMutation.mutate(id!, {
      onSuccess: () => navigate("/platform/kpis"),
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!kpi) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-muted-foreground">المؤشر غير موجود</p>
          <Button onClick={() => navigate("/kpis")} className="mt-4">
            العودة للمؤشرات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/platform/kpis")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{kpi.title}</h1>
            <p className="text-muted-foreground mt-1">الرمز: {kpi.code}</p>
          </div>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 ml-2" />
              تعديل
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 ml-2" />
              حذف
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات المؤشر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">وحدة القياس:</span>
              <p className="text-lg">{kpi.unit}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">الاتجاه:</span>
              <Badge className="mr-2">
                {kpi.direction === "up" ? "أعلى أفضل" : "أقل أفضل"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الرسم البياني</CardTitle>
        </CardHeader>
        <CardContent>
          <KPIChart kpi={kpi} targets={targets || []} readings={readings || []} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">القيم المستهدفة</h2>
          {canWrite && (
            <Button onClick={() => setIsTargetDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة قيمة مستهدفة
            </Button>
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            {targets && targets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفترة</TableHead>
                    <TableHead>القيمة المستهدفة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets.map((target) => (
                    <TableRow key={target.id}>
                      <TableCell>{target.period}</TableCell>
                      <TableCell>{target.target_value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">لا توجد قيم مستهدفة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">القراءات الفعلية</h2>
          {canWrite && (
            <Button onClick={() => setIsReadingDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة قراءة
            </Button>
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            {readings && readings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفترة</TableHead>
                    <TableHead>القيمة الفعلية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>{reading.period}</TableCell>
                      <TableCell>{reading.actual_value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">لا توجد قراءات فعلية</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل مؤشر الأداء</DialogTitle>
          </DialogHeader>
          <KPIForm
            kpi={kpi}
            onSuccess={() => setIsEditDialogOpen(false)}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة قيمة مستهدفة</DialogTitle>
          </DialogHeader>
          <TargetForm
            kpiId={kpi.id}
            onSuccess={() => setIsTargetDialogOpen(false)}
            onCancel={() => setIsTargetDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isReadingDialogOpen} onOpenChange={setIsReadingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة قراءة فعلية</DialogTitle>
          </DialogHeader>
          <ReadingForm
            kpiId={kpi.id}
            onSuccess={() => setIsReadingDialogOpen(false)}
            onCancel={() => setIsReadingDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف مؤشر الأداء وجميع القيم المستهدفة والقراءات المرتبطة به بشكل نهائي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
