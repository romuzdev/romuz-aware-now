/**
 * Policies Admin Page
 * Gate-D2: Policies Module - D1 Standard Upgrade
 * 
 * Full-featured policies management with:
 * - Saved Views with URL state management
 * - Real-time updates
 * - Bulk operations (delete, update status, archive)
 * - Import/Export (CSV, JSON)
 * - Advanced filtering and sorting
 */

import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/core/components/ui/button";
import { Checkbox } from "@/core/components/ui/checkbox";
import { usePolicies } from "@/modules/policies";
import { useNavigate } from "react-router-dom";
import { 
  PolicyFormDialog,
  PoliciesFilters as PoliciesFiltersComponent,
  PoliciesPagination,
  RealtimeIndicator,
  PoliciesStats,
  PolicyStatusBadge
} from "@/modules/policies";
import { SavedViewsPanel, BulkOperationsDialog, ImportExportDialog } from "@/core/components";
import { usePoliciesFilters } from "@/apps/awareness/hooks/usePoliciesFilters";
import { usePoliciesBulk } from "@/apps/awareness/hooks/usePoliciesBulk";
import { usePoliciesImportExport } from "@/apps/awareness/hooks/usePoliciesImportExport";
import { Download, Upload, ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2, Archive } from "lucide-react";
import { useAppContext } from "@/lib/app-context/AppContextProvider";
import { supabase } from "@/integrations/supabase/client";
import type { Policy } from "@/modules/policies";

export default function PoliciesAdmin() {
  const { t } = useTranslation();
  const { data: policies, loading, error, refetch } = usePolicies();
  const { tenantId } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${t('awareness.policies.title')} | Romuz`;
  }, [t]);
  
  // State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  // Bulk operations
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkArchiveDialog, setShowBulkArchiveDialog] = useState(false);
  
  // Import/Export
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Custom Hooks
  const {
    filters,
    sortConfig,
    updateFilters,
    clearFilters,
    updateSort,
    applyFilters,
    applySort,
  } = usePoliciesFilters();
  
  const {
    selectedIds,
    selectedCount,
    isExecuting: isBulkExecuting,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    bulkDelete,
    bulkArchive,
    progress: bulkProgress,
  } = usePoliciesBulk();
  
  const {
    exportPolicies,
    importPolicies,
    isExporting,
    isImporting,
  } = usePoliciesImportExport();

  // Monitor realtime connection status
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('policies-status-check')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'policies',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          setLastUpdateTime(new Date());
        }
      )
      .on('system', {}, (payload) => {
        if (payload.status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (payload.status === 'CLOSED') {
          setIsRealtimeConnected(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  // Extract unique categories and owners for filters
  const { categories, owners } = useMemo(() => {
    const cats = new Set<string>();
    const owns = new Set<string>();
    
    policies.forEach((policy) => {
      if (policy.category) cats.add(policy.category);
      if (policy.owner) owns.add(policy.owner);
    });

    return {
      categories: Array.from(cats).sort(),
      owners: Array.from(owns).sort(),
    };
  }, [policies]);

  // Apply filters and sorting
  const filteredPolicies = useMemo(() => applyFilters(policies), [policies, applyFilters]);
  const sortedPolicies = useMemo(() => applySort(filteredPolicies), [filteredPolicies, applySort]);

  // Pagination
  const totalPages = Math.ceil(sortedPolicies.length / pageSize);
  const paginatedPolicies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedPolicies.slice(startIndex, endIndex);
  }, [sortedPolicies, currentPage, pageSize]);

  // Handlers
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleExport = (format: 'csv' | 'json') => {
    exportPolicies(filteredPolicies, format);
  };

  const handleImportComplete = () => {
    setShowImportDialog(false);
    refetch();
  };

  const handleBulkDeleteConfirm = async () => {
    await bulkDelete();
    setShowBulkDeleteDialog(false);
    refetch();
  };

  const handleBulkArchiveConfirm = async () => {
    await bulkArchive();
    setShowBulkArchiveDialog(false);
    refetch();
  };

  const isAllSelected = paginatedPolicies.length > 0 && 
    paginatedPolicies.every((p) => selectedIds.has(p.id));

  const renderSortIcon = (field: keyof Policy) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary" />
    );
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">خطأ في تحميل البيانات: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('awareness.policies.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('awareness.policies.description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeIndicator 
            isConnected={isRealtimeConnected} 
            lastUpdateTime={lastUpdateTime} 
          />
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('awareness.policies.addPolicy')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <PoliciesStats policies={policies} />

      {/* Saved Views Panel */}
      <SavedViewsPanel
        pageKey="policies"
        currentFilters={filters}
        onApplyView={(newFilters) => {
          updateFilters(newFilters);
        }}
      />

      {/* Filters */}
      <PoliciesFiltersComponent
        filters={filters}
        onFiltersChange={updateFilters}
        categories={categories}
        owners={owners}
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                disabled={isBulkExecuting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                حذف ({selectedCount})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkArchiveDialog(true)}
                disabled={isBulkExecuting}
              >
                <Archive className="h-4 w-4 mr-2" />
                أرشفة ({selectedCount})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={isBulkExecuting}
              >
                إلغاء التحديد
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={isExporting || filteredPolicies.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            disabled={isExporting || filteredPolicies.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            استيراد
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-right">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={() => toggleSelectAll(paginatedPolicies.map((p) => p.id))}
                  />
                </th>
                <th 
                  className="h-12 px-4 text-right font-medium cursor-pointer hover:bg-muted/80"
                  onClick={() => updateSort('code')}
                >
                  <div className="flex items-center gap-2">
                    الكود
                    {renderSortIcon('code')}
                  </div>
                </th>
                <th 
                  className="h-12 px-4 text-right font-medium cursor-pointer hover:bg-muted/80"
                  onClick={() => updateSort('title')}
                >
                  <div className="flex items-center gap-2">
                    العنوان
                    {renderSortIcon('title')}
                  </div>
                </th>
                <th 
                  className="h-12 px-4 text-right font-medium cursor-pointer hover:bg-muted/80"
                  onClick={() => updateSort('status')}
                >
                  <div className="flex items-center gap-2">
                    الحالة
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="h-12 px-4 text-right font-medium cursor-pointer hover:bg-muted/80"
                  onClick={() => updateSort('category')}
                >
                  <div className="flex items-center gap-2">
                    الفئة
                    {renderSortIcon('category')}
                  </div>
                </th>
                <th 
                  className="h-12 px-4 text-right font-medium cursor-pointer hover:bg-muted/80"
                  onClick={() => updateSort('owner')}
                >
                  <div className="flex items-center gap-2">
                    المالك
                    {renderSortIcon('owner')}
                  </div>
                </th>
                <th className="h-12 px-4 text-right font-medium">
                  آخر مراجعة
                </th>
                <th className="h-12 px-4 text-right font-medium">
                  المراجعة القادمة
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-muted-foreground">جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedPolicies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="h-32 text-center text-muted-foreground">
                    لا توجد سياسات
                  </td>
                </tr>
              ) : (
                paginatedPolicies.map((policy) => (
                  <tr
                    key={policy.id}
                    className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                        return;
                      }
                      navigate(`/awareness/policies/${policy.id}`);
                    }}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedIds.has(policy.id)}
                        onCheckedChange={() => toggleSelection(policy.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{policy.code}</td>
                    <td className="px-4 py-3">{policy.title}</td>
                    <td className="px-4 py-3">
                      <PolicyStatusBadge status={policy.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {policy.category || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {policy.owner || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {policy.last_review_date || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {policy.next_review_date || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <PoliciesPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={sortedPolicies.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Dialogs */}
      <PolicyFormDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) refetch();
        }}
      />

      <BulkOperationsDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        title="تأكيد الحذف الجماعي"
        description={`هل أنت متأكد من حذف ${selectedCount} سياسة؟`}
        selectedCount={selectedCount}
        operationType="delete"
        isExecuting={isBulkExecuting}
        progress={bulkProgress}
        onConfirm={handleBulkDeleteConfirm}
        confirmLabel="حذف"
        confirmVariant="destructive"
      />

      <BulkOperationsDialog
        open={showBulkArchiveDialog}
        onOpenChange={setShowBulkArchiveDialog}
        title="تأكيد الأرشفة الجماعية"
        description={`هل أنت متأكد من أرشفة ${selectedCount} سياسة؟`}
        selectedCount={selectedCount}
        operationType="archive"
        isExecuting={isBulkExecuting}
        progress={bulkProgress}
        onConfirm={handleBulkArchiveConfirm}
        confirmLabel="أرشفة"
        confirmVariant="default"
      />

      <ImportExportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        entityType="policy"
        onExport={async (format) => {
          if (format === 'xlsx') return;
          await exportPolicies(filteredPolicies, format);
        }}
        onImport={async (file) => {
          await importPolicies(file);
          handleImportComplete();
        }}
        isImporting={isImporting}
        isExporting={isExporting}
      />
    </div>
  );
}
