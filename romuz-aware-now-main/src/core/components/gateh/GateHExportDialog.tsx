// ============================================================================
// Gate-H: Export Actions Dialog
// Filters UI + Format Selection + Export
// ============================================================================

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/core/components/ui/button";
import { Calendar } from "@/core/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover";
import { Label } from "@/core/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/core/components/ui/radio-group";
import { Checkbox } from "@/core/components/ui/checkbox";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { Separator } from "@/core/components/ui/separator";
import { useGateHExport, type ExportFormat } from "@/modules/actions";
import type { GateHExportFilters } from "@/modules/actions";

// ============================================================
// Filter Options
// ============================================================

const STATUS_OPTIONS = [
  { value: "new", label: "جديد" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "blocked", label: "معطل" },
  { value: "verify", label: "بانتظار التحقق" },
  { value: "closed", label: "مغلق" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "critical", label: "حرج" },
  { value: "high", label: "عالي" },
  { value: "medium", label: "متوسط" },
  { value: "low", label: "منخفض" },
] as const;

// ============================================================
// Component Props
// ============================================================

interface GateHExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================
// Main Component
// ============================================================

export function GateHExportDialog({ open, onOpenChange }: GateHExportDialogProps) {
  // Export hook
  const exportActions = useGateHExport();

  // Filter state
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");

  // ============================================================
  // Handlers
  // ============================================================

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handlePriorityToggle = (priority: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  const handleExport = () => {
    const filters: GateHExportFilters = {
      fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
      toDate: toDate ? format(toDate, "yyyy-MM-dd") : undefined,
      statuses: selectedStatuses.length > 0 ? selectedStatuses as any : undefined,
      priorities: selectedPriorities.length > 0 ? selectedPriorities as any : undefined,
      overdueOnly,
    };

    exportActions.mutate(
      { format: exportFormat, filters },
      {
        onSuccess: () => {
          // Close dialog on successful export
          onOpenChange(false);
        },
      }
    );
  };

  const handleReset = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setOverdueOnly(false);
    setExportFormat("csv");
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            تصدير الإجراءات
          </DialogTitle>
          <DialogDescription>
            اختر الفلاتر وصيغة التصدير المناسبة لاحتياجاتك
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6 py-4">
            {/* Date Range */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">نطاق التاريخ</Label>
              <div className="grid grid-cols-2 gap-4">
                {/* From Date */}
                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !fromDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {fromDate ? format(fromDate, "PPP") : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fromDate}
                        onSelect={setFromDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* To Date */}
                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !toDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {toDate ? format(toDate, "PPP") : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={toDate}
                        onSelect={setToDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        disabled={(date) => fromDate ? date < fromDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Separator />

            {/* Status Filter */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">حالة الإجراء</Label>
              <div className="grid grid-cols-2 gap-3">
                {STATUS_OPTIONS.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                    />
                    <label
                      htmlFor={`status-${status.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {status.label}
                    </label>
                  </div>
                ))}
              </div>
              {selectedStatuses.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  لم يتم اختيار أي حالة (سيتم تصدير جميع الحالات)
                </p>
              )}
            </div>

            <Separator />

            {/* Priority Filter */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">الأولوية</Label>
              <div className="grid grid-cols-2 gap-3">
                {PRIORITY_OPTIONS.map((priority) => (
                  <div key={priority.value} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`priority-${priority.value}`}
                      checked={selectedPriorities.includes(priority.value)}
                      onCheckedChange={() => handlePriorityToggle(priority.value)}
                    />
                    <label
                      htmlFor={`priority-${priority.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {priority.label}
                    </label>
                  </div>
                ))}
              </div>
              {selectedPriorities.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  لم يتم اختيار أي أولوية (سيتم تصدير جميع الأولويات)
                </p>
              )}
            </div>

            <Separator />

            {/* Overdue Filter */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="overdue-only"
                checked={overdueOnly}
                onCheckedChange={(checked) => setOverdueOnly(checked === true)}
              />
              <label
                htmlFor="overdue-only"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                الإجراءات المتأخرة فقط
              </label>
            </div>

            <Separator />

            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">صيغة التصدير</Label>
              <RadioGroup value={exportFormat} onValueChange={(val) => setExportFormat(val as ExportFormat)}>
                <div className="flex items-center space-x-3 space-x-reverse p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="csv" id="format-csv" />
                  <label
                    htmlFor="format-csv"
                    className="flex-1 cursor-pointer flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">CSV</div>
                      <div className="text-xs text-muted-foreground">
                        ملف نصي يمكن فتحه في Excel أو Google Sheets
                      </div>
                    </div>
                  </label>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="json" id="format-json" />
                  <label
                    htmlFor="format-json"
                    className="flex-1 cursor-pointer flex items-center gap-2"
                  >
                    <FileJson className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">JSON</div>
                      <div className="text-xs text-muted-foreground">
                        ملف منظم للتكامل مع الأنظمة الأخرى
                      </div>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={exportActions.isPending}
          >
            إعادة تعيين
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={exportActions.isPending}
            className="gap-2"
          >
            {exportActions.isPending ? (
              <>جاري التصدير...</>
            ) : (
              <>
                <Download className="h-4 w-4" />
                تصدير
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
