// ============================================================================
// Gate-H: Actions List Page
// Closed-loop action plans management with filters & export
// ============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, RefreshCw, Database } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { useGateHActions } from "@/modules/actions";
import { seedDemoActions } from "@/modules/actions/integration";
import { GateHExportDialog } from "@/core/components/gateh";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { GateHActionStatus, GateHActionPriority } from "@/modules/actions";

// ============================================================
// Status Badge Component
// ============================================================

const STATUS_LABELS: Record<GateHActionStatus, string> = {
  new: "جديد",
  in_progress: "قيد التنفيذ",
  blocked: "معطل",
  verify: "بانتظار التحقق",
  closed: "مغلق",
};

const STATUS_VARIANTS: Record<GateHActionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  in_progress: "secondary",
  blocked: "destructive",
  verify: "outline",
  closed: "outline",
};

function StatusBadge({ status }: { status: GateHActionStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// ============================================================
// Priority Badge Component
// ============================================================

const PRIORITY_LABELS: Record<GateHActionPriority, string> = {
  critical: "حرج",
  high: "عالي",
  medium: "متوسط",
  low: "منخفض",
};

const PRIORITY_VARIANTS: Record<GateHActionPriority, "default" | "secondary" | "destructive" | "outline"> = {
  critical: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
};

function PriorityBadge({ priority }: { priority: GateHActionPriority }) {
  return (
    <Badge variant={PRIORITY_VARIANTS[priority]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

// ============================================================
// Main Page Component
// ============================================================

export default function GateHActionsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch actions
  const { data: actions, isLoading, error, refetch } = useGateHActions();

  // Stats calculation
  const stats = {
    total: actions?.length || 0,
    new: actions?.filter((a) => a.status === "new").length || 0,
    inProgress: actions?.filter((a) => a.status === "in_progress").length || 0,
    overdue: actions?.filter((a) => a.is_overdue).length || 0,
  };

  // ============================================================
  // Handlers
  // ============================================================

  const handleRefresh = () => {
    refetch();
    toast({
      title: "تم التحديث",
      description: "تم تحديث قائمة الإجراءات بنجاح",
    });
  };

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoActions();
      toast({
        title: "تم زرع البيانات التجريبية",
        description: "تم إضافة إجراءات تجريبية بنجاح",
      });
      // Refresh list after seeding
      setTimeout(() => {
        refetch();
      }, 500);
    } catch (error) {
      toast({
        title: "فشل زرع البيانات",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gate-H — خطط الإجراءات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة الإجراءات التصحيحية والوقائية المستمدة من التوصيات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSeedDemoData}
            disabled={isSeeding || isLoading}
            className="gap-2"
          >
            <Database className={`h-4 w-4 ${isSeeding ? "animate-pulse" : ""}`} />
            {isSeeding ? "جاري الزرع..." : "بيانات تجريبية"}
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button
            variant="outline"
            onClick={() => setExportDialogOpen(true)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button 
            className="gap-2"
            disabled
            title="سيتم تفعيل هذه الميزة لاحقاً"
          >
            <Plus className="h-4 w-4" />
            إجراء جديد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>إجمالي الإجراءات</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>إجراءات جديدة</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.new}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>قيد التنفيذ</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>متأخرة</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.overdue}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الإجراءات</CardTitle>
          <CardDescription>
            جميع الإجراءات المطلوبة مع حالة التنفيذ والأولوية
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              <p>حدث خطأ أثناء تحميل الإجراءات</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error instanceof Error ? error.message : "خطأ غير معروف"}
              </p>
            </div>
          )}

          {!isLoading && !error && actions && actions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">لا توجد إجراءات حالياً</p>
              <p className="text-sm mt-2">ابدأ بإنشاء إجراء جديد أو استيراد التوصيات من Gate-K</p>
            </div>
          )}

          {!isLoading && !error && actions && actions.length > 0 && (
            <div className="space-y-3">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/grc/actions/${action.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={action.status} />
                        <PriorityBadge priority={action.priority} />
                        {action.is_overdue && (
                          <Badge variant="destructive">متأخر</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{action.title_ar}</h3>
                      {action.desc_ar && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {action.desc_ar}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {action.kpi_key && (
                          <span>KPI: {action.kpi_key}</span>
                        )}
                        {action.assignee_display_name && (
                          <span>المسؤول: {action.assignee_display_name}</span>
                        )}
                        {action.due_date && (
                          <span>
                            الموعد النهائي: {new Date(action.due_date).toLocaleDateString("ar-SA")}
                          </span>
                        )}
                        {action.days_until_due !== null && action.days_until_due !== undefined && (
                          <span className={action.days_until_due < 0 ? "text-red-600 font-medium" : ""}>
                            {action.days_until_due < 0 
                              ? `متأخر ${Math.abs(action.days_until_due)} يوم`
                              : `باقي ${action.days_until_due} يوم`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <GateHExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />
    </div>
  );
}
