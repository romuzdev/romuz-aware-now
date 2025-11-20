import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { useKPIs } from "@/modules/objectives";
import { KPIsList } from "@/modules/objectives/components/kpis/KPIsList";
import { KPIForm } from "@/modules/objectives/components/kpis/KPIForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { KPIGuards } from "@/modules/objectives/integration/objectives-guards";
import { Skeleton } from "@/core/components/ui/skeleton";

export default function KPIs() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters] = useState({});
  const { data: kpis, isLoading } = useKPIs(filters);
  const canWrite = KPIGuards.canWrite();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">مؤشرات الأداء الرئيسية</h1>
          <p className="text-muted-foreground mt-1">
            إدارة ومتابعة مؤشرات الأداء الرئيسية (KPIs)
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة مؤشر جديد
          </Button>
        )}
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <KPIsList kpis={kpis || []} />
        )}
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة مؤشر أداء جديد</DialogTitle>
          </DialogHeader>
          <KPIForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
