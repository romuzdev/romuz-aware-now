import { useState } from "react";
import { Plus, Database, Trash2 } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { useObjectives } from "@/modules/objectives";
import { ObjectivesList } from "@/modules/objectives/components/objectives/ObjectivesList";
import { ObjectiveForm } from "@/modules/objectives/components/objectives/ObjectiveForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { ObjectiveGuards } from "@/modules/objectives/integration/objectives-guards";
import { Skeleton } from "@/core/components/ui/skeleton";
import { toast } from "sonner";
import { seedAwarenessTestData, clearTestData } from "@/integrations/supabase/test-data";

export default function Objectives() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters] = useState({});
  const { data: objectives, isLoading } = useObjectives(filters);
  const canWrite = ObjectiveGuards.canWrite();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const res = await seedAwarenessTestData();
      toast.success(res.message || "تم إنشاء البيانات التجريبية");
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message || "فشل في إنشاء البيانات التجريبية");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClear = async () => {
    const ok = window.confirm("هل أنت متأكد من حذف جميع البيانات التجريبية؟");
    if (!ok) return;
    try {
      setIsClearing(true);
      const res = await clearTestData();
      toast.success(res.message || "تم حذف البيانات التجريبية");
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message || "فشل في حذف البيانات التجريبية");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الأهداف الاستراتيجية</h1>
          <p className="text-muted-foreground mt-1">
            إدارة الأهداف الاستراتيجية ومؤشرات الأداء الرئيسية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleSeed} disabled={isSeeding || isClearing}>
            <Database className="ml-2 h-4 w-4" />
            {isSeeding ? "جاري الإنشاء..." : "إنشاء بيانات تجريبية"}
          </Button>
          <Button variant="destructive" onClick={handleClear} disabled={isSeeding || isClearing}>
            <Trash2 className="ml-2 h-4 w-4" />
            {isClearing ? "جاري الحذف..." : "حذف البيانات التجريبية"}
          </Button>
          {canWrite && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة هدف جديد
            </Button>
          )}
        </div>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <ObjectivesList objectives={objectives || []} />
        )}
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة هدف استراتيجي جديد</DialogTitle>
          </DialogHeader>
          <ObjectiveForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
