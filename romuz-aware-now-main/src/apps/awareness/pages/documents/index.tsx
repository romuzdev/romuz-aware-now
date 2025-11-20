/**
 * Documents Admin Page
 * Gate-D3: Documents Module - D1 Standard Upgrade
 * 
 * Full-featured documents management with:
 * - Saved Views with URL state management
 * - Real-time updates
 * - Bulk operations (delete, update status, archive)
 * - Import/Export (CSV, JSON)
 * - Advanced filtering and sorting
 */

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/core/components/ui/button";
import { Checkbox } from "@/core/components/ui/checkbox";
import { useDocuments } from "@/modules/documents";
import { useNavigate } from "react-router-dom";
import { SavedViewsPanel, BulkOperationsDialog, ImportExportDialog } from "@/core/components";
import { useDocumentsFilters } from "@/apps/awareness/hooks/useDocumentsFilters";
import { useDocumentsBulk } from "@/apps/awareness/hooks/useDocumentsBulk";
import { useDocumentsImportExport } from "@/apps/awareness/hooks/useDocumentsImportExport";
import { Download, Upload, ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2, Archive, FileText } from "lucide-react";
import { useAppContext } from "@/lib/app-context/AppContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/core/components/ui/badge";
import type { Document } from "@/modules/documents";

// Document Status Badge Component
function DocumentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'مسودة' },
    active: { bg: 'bg-green-100', text: 'text-green-800', label: 'نشط' },
    archived: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'مؤرشف' },
  };
  const variant = variants[status] || variants.draft;
  return <Badge className={`${variant.bg} ${variant.text}`}>{variant.label}</Badge>;
}

// Document Type Badge Component
function DocumentTypeBadge({ docType }: { docType: string }) {
  const variants: Record<string, string> = {
    policy: 'سياسة',
    procedure: 'إجراء',
    guideline: 'إرشادات',
    report: 'تقرير',
    awareness_material: 'مواد توعية',
    other: 'أخرى',
  };
  return <Badge variant="outline">{variants[docType] || docType}</Badge>;
}

export default function DocumentsAdmin() {
  const { data: documents, loading, error, refetch } = useDocuments();
  const { tenantId } = useAppContext();
  const navigate = useNavigate();
  
  // State
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
  } = useDocumentsFilters();
  
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
  } = useDocumentsBulk();
  
  const {
    exportDocuments,
    importDocuments,
    isExporting,
    isImporting,
  } = useDocumentsImportExport();

  // Monitor realtime connection status
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('documents-status-check')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
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

  // Apply filters and sorting
  const filteredDocuments = useMemo(() => applyFilters(documents), [documents, applyFilters]);
  const sortedDocuments = useMemo(() => applySort(filteredDocuments), [filteredDocuments, applySort]);

  // Pagination
  const totalPages = Math.ceil(sortedDocuments.length / pageSize);
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedDocuments.slice(startIndex, endIndex);
  }, [sortedDocuments, currentPage, pageSize]);

  // Handlers
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleExport = (format: 'csv' | 'json') => {
    exportDocuments(filteredDocuments, format);
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

  const isAllSelected = paginatedDocuments.length > 0 && 
    paginatedDocuments.every((doc) => selectedIds.has(doc.id));

  const renderSortIcon = (field: keyof Document) => {
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
          <h1 className="text-3xl font-bold tracking-tight">المستندات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة وتتبع المستندات التنظيمية
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isRealtimeConnected ? "default" : "outline"}>
            {isRealtimeConnected ? "متصل" : "غير متصل"}
          </Badge>
          <Button onClick={() => navigate('/admin/documents/create')}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة مستند
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المستندات</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">نشط</p>
              <p className="text-2xl font-bold">
                {documents.filter(d => d.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-sm text-muted-foreground">مسودات</p>
              <p className="text-2xl font-bold">
                {documents.filter(d => d.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm text-muted-foreground">مؤرشف</p>
              <p className="text-2xl font-bold">
                {documents.filter(d => d.status === 'archived').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Views Panel */}
      <SavedViewsPanel
        pageKey="documents"
        currentFilters={filters}
        onApplyView={(newFilters) => {
          updateFilters(newFilters);
        }}
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
            disabled={isExporting || filteredDocuments.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            disabled={isExporting || filteredDocuments.length === 0}
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
                    onCheckedChange={() => toggleSelectAll(paginatedDocuments.map((d) => d.id))}
                  />
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
                  onClick={() => updateSort('doc_type')}
                >
                  <div className="flex items-center gap-2">
                    النوع
                    {renderSortIcon('doc_type')}
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
                <th className="h-12 px-4 text-right font-medium">
                  الوصف
                </th>
                <th className="h-12 px-4 text-right font-medium">
                  تاريخ التحديث
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-muted-foreground">جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-muted-foreground">
                    لا توجد مستندات
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map((document) => (
                  <tr
                    key={document.id}
                    className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                        return;
                      }
                      navigate(`/admin/documents/${document.id}`);
                    }}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedIds.has(document.id)}
                        onCheckedChange={() => toggleSelection(document.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{document.title}</td>
                    <td className="px-4 py-3">
                      <DocumentTypeBadge docType={document.doc_type} />
                    </td>
                    <td className="px-4 py-3">
                      <DocumentStatusBadge status={document.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {document.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">
                      {new Date(document.updated_at).toLocaleDateString('ar')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          عرض {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedDocuments.length)} من {sortedDocuments.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            السابق
          </Button>
          <span className="text-sm">
            صفحة {currentPage} من {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            التالي
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <BulkOperationsDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        title="تأكيد الحذف الجماعي"
        description={`هل أنت متأكد من حذف ${selectedCount} مستند؟`}
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
        description={`هل أنت متأكد من أرشفة ${selectedCount} مستند؟`}
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
        entityType="document"
        onExport={async (format) => {
          if (format === 'xlsx') return;
          await exportDocuments(filteredDocuments, format);
        }}
        onImport={async (file) => {
          await importDocuments(file);
          handleImportComplete();
        }}
        isImporting={isImporting}
        isExporting={isExporting}
      />
    </div>
  );
}
