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
import { useObjective, useDeleteObjective } from "@/modules/objectives";
import { ObjectiveForm } from "@/modules/objectives/components/objectives/ObjectiveForm";
import { KPICard } from "@/modules/objectives/components/kpis/KPICard";
import { KPIForm } from "@/modules/objectives/components/kpis/KPIForm";
import { InitiativeCard } from "@/modules/objectives/components/initiatives/InitiativeCard";
import { InitiativeForm } from "@/modules/objectives/components/initiatives/InitiativeForm";
import { ObjectiveGuards, KPIGuards, InitiativeGuards } from "@/modules/objectives/integration/objectives-guards";
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

export default function ObjectiveDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isKPIDialogOpen, setIsKPIDialogOpen] = useState(false);
  const [isInitiativeDialogOpen, setIsInitiativeDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: objective, isLoading } = useObjective(id!);
  const deleteMutation = useDeleteObjective();

  const canWrite = ObjectiveGuards.canWrite();
  const canWriteKPI = KPIGuards.canWrite();
  const canWriteInitiative = InitiativeGuards.canWrite();

  const handleDelete = () => {
    deleteMutation.mutate(id!, {
      onSuccess: () => navigate("/platform/objectives"),
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

  if (!objective) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-muted-foreground">الهدف غير موجود</p>
          <Button onClick={() => navigate("/objectives")} className="mt-4">
            العودة للأهداف
          </Button>
        </div>
      </div>
    );
  }

  const statusLabels: Record<typeof objective.status, string> = {
    active: "نشط",
    archived: "مؤرشف",
    on_hold: "معلق",
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/platform/objectives")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{objective.title}</h1>
            <p className="text-muted-foreground mt-1">الرمز: {objective.code}</p>
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
          <CardTitle>معلومات الهدف</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">الحالة:</span>
            <Badge className="mr-2" variant={objective.status === "active" ? "default" : "secondary"}>
              {statusLabels[objective.status]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">مؤشرات الأداء (KPIs)</h2>
          {canWriteKPI && (
            <Button onClick={() => setIsKPIDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة مؤشر
            </Button>
          )}
        </div>
        {objective.kpis && objective.kpis.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {objective.kpis.map((kpi) => (
              <KPICard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">لا توجد مؤشرات أداء لهذا الهدف</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">المبادرات</h2>
          {canWriteInitiative && (
            <Button onClick={() => setIsInitiativeDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة مبادرة
            </Button>
          )}
        </div>
        {objective.initiatives && objective.initiatives.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {objective.initiatives.map((initiative) => (
              <InitiativeCard key={initiative.id} initiative={initiative} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">لا توجد مبادرات لهذا الهدف</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل الهدف الاستراتيجي</DialogTitle>
          </DialogHeader>
          <ObjectiveForm
            objective={objective}
            onSuccess={() => setIsEditDialogOpen(false)}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isKPIDialogOpen} onOpenChange={setIsKPIDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة مؤشر أداء جديد</DialogTitle>
          </DialogHeader>
          <KPIForm
            objectiveId={objective.id}
            onSuccess={() => setIsKPIDialogOpen(false)}
            onCancel={() => setIsKPIDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isInitiativeDialogOpen} onOpenChange={setIsInitiativeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة مبادرة جديدة</DialogTitle>
          </DialogHeader>
          <InitiativeForm
            objectiveId={objective.id}
            onSuccess={() => setIsInitiativeDialogOpen(false)}
            onCancel={() => setIsInitiativeDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الهدف الاستراتيجي وجميع مؤشرات الأداء والمبادرات المرتبطة به بشكل نهائي.
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
