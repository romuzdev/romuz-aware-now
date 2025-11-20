/**
 * Committees List Page
 * Gate-K: D4 Upgrade - D1 Standard Complete
 * 
 * Features:
 * - Saved Views with URL state management  
 * - Bulk Operations (delete, archive, status update)
 * - Import/Export (CSV, JSON, XLSX)
 * - Real-time updates
 * - Advanced filtering
 * - Checkbox selection
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Archive,
  MoreHorizontal,
  FileDown,
} from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { Checkbox } from '@/core/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Skeleton } from '@/core/components/ui/skeleton';
import { fetchCommittees } from '@/modules/committees/integration';
import { useCan } from '@/core/rbac';
import { format } from 'date-fns';

// D1 Standard Components & Hooks
import { SavedViewsPanel, BulkOperationsDialog, ImportExportDialog } from '@/core/components';
import { useCommitteesFilters } from '@/apps/awareness/hooks/useCommitteesFilters';
import { useCommitteesRealtime } from '@/apps/awareness/hooks/useCommitteesRealtime';
import { useCommitteesBulk } from '@/apps/awareness/hooks/useCommitteesBulk';
import { useCommitteesImportExport } from '@/apps/awareness/hooks/useCommitteesImportExport';

export default function CommitteesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const can = useCan();

  // Filters with URL state & saved views
  const {
    filters,
    setFilters,
    resetFilters,
    savedViews,
    applySavedView,
    saveCurrentView,
    deleteSavedView,
    setDefaultView,
    isLoadingViews,
  } = useCommitteesFilters();

  // Real-time updates
  useCommitteesRealtime(true);

  // Bulk operations
  const {
    deleteMultiple,
    archiveMultiple,
    isExecuting: isBulkExecuting,
    progress: bulkProgress,
  } = useCommitteesBulk();

  // Import/Export
  const {
    exportCommittees,
    importCommittees,
    isExporting,
    isImporting,
  } = useCommitteesImportExport();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<'delete' | 'archive'>('delete');
  const [importExportDialogOpen, setImportExportDialogOpen] = useState(false);

  // Permissions
  const canWrite = can('committee.write');
  const canDelete = can('committee.delete');

  // Fetch committees with caching
  const { data: committees, isLoading, error } = useQuery({
    queryKey: ['committees'],
    queryFn: fetchCommittees,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000,
  });

  // Apply filters
  const filteredCommittees = useMemo(() => {
    if (!committees) return [];

    return committees.filter((committee) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch =
          committee.code.toLowerCase().includes(search) ||
          committee.name.toLowerCase().includes(search) ||
          committee.name_ar?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (committee.status !== filters.status) return false;
      }

      // Date filters
      if (filters.dateFrom) {
        const committeeDate = new Date(committee.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (committeeDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const committeeDate = new Date(committee.created_at);
        const toDate = new Date(filters.dateTo);
        if (committeeDate > toDate) return false;
      }

      return true;
    });
  }, [committees, filters]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCommittees.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const isAllSelected = selectedIds.length === filteredCommittees.length && filteredCommittees.length > 0;

  // Bulk operation handlers
  const handleBulkDelete = () => {
    setBulkOperation('delete');
    setBulkDialogOpen(true);
  };

  const handleBulkArchive = () => {
    setBulkOperation('archive');
    setBulkDialogOpen(true);
  };

  const confirmBulkOperation = async () => {
    try {
      if (bulkOperation === 'delete') {
        await deleteMultiple(selectedIds);
      } else if (bulkOperation === 'archive') {
        await archiveMultiple(selectedIds);
      }
      
      setSelectedIds([]);
      setBulkDialogOpen(false);
    } catch (error) {
      console.error('Bulk operation failed:', error);
    }
  };

  // Import/Export handlers
  const handleExport = async (format: 'csv' | 'json' | 'xlsx') => {
    await exportCommittees(format, filters);
  };

  const handleImport = async (file: File, format: 'csv' | 'json' | 'xlsx') => {
    await importCommittees(file, format);
    setImportExportDialogOpen(false);
  };

  // Badge variant helper
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'dissolved':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Loading state
  if (isLoading || isLoadingViews) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">{t('committees.errorLoading')}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Saved Views Panel - Sidebar */}
      <div className="lg:col-span-1">
        <SavedViewsPanel
          pageKey="committees:list"
          currentFilters={filters}
          onApplyView={(viewFilters) => {
            Object.entries(viewFilters).forEach(([key, value]) => {
              setFilters({ [key]: value });
            });
          }}
        />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('committees.title')}</CardTitle>
                <CardDescription>
                  {filteredCommittees.length} لجنة
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportExportDialogOpen(true)}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  استيراد / تصدير
                </Button>
                {canWrite && (
                  <Button onClick={() => navigate('/awareness/committees/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('committees.newCommittee')}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters Bar */}
            <div className="flex items-center gap-4">
              <Input
                placeholder="بحث بالكود، الاسم..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="max-w-xs"
              />
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ status: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="inactive">غير نشطة</SelectItem>
                  <SelectItem value="dissolved">منحلة</SelectItem>
                </SelectContent>
              </Select>
              {Object.values(filters).some(v => v && v !== 'all') && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  إعادة تعيين
                </Button>
              )}
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm font-medium">
                  تم تحديد {selectedIds.length} عنصر
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkArchive}
                    disabled={isBulkExecuting}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    أرشفة
                  </Button>
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isBulkExecuting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      حذف
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Table */}
            {filteredCommittees.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="تحديد الكل"
                        />
                      </TableHead>
                      <TableHead>الكود</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الأعضاء</TableHead>
                      <TableHead>الاجتماع القادم</TableHead>
                      <TableHead>آخر تحديث</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommittees.map((committee) => (
                      <TableRow
                        key={committee.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
                            (e.target as HTMLElement).closest('button')
                          ) {
                            return;
                          }
                          navigate(`/awareness/committees/${committee.id}`);
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(committee.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(committee.id, checked as boolean)
                            }
                            aria-label={`تحديد ${committee.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {committee.code}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{committee.name}</div>
                            {committee.name_ar && (
                              <div className="text-sm text-muted-foreground">
                                {committee.name_ar}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(committee.status)}>
                            {t(`committees.status.${committee.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{committee.member_count || 0}</TableCell>
                        <TableCell>
                          {committee.next_meeting_at
                            ? format(new Date(committee.next_meeting_at), 'yyyy-MM-dd')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(committee.updated_at), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => navigate(`/awareness/committees/${committee.id}`)}
                              >
                                عرض التفاصيل
                              </DropdownMenuItem>
                              {canWrite && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/awareness/committees/${committee.id}/edit`)}
                                >
                                  تعديل
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {canDelete && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedIds([committee.id]);
                                    handleBulkDelete();
                                  }}
                                >
                                  حذف
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t('committees.noCommittees')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Operations Dialog */}
      <BulkOperationsDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        title={
          bulkOperation === 'delete'
            ? 'حذف اللجان المحددة'
            : 'أرشفة اللجان المحددة'
        }
        description={
          bulkOperation === 'delete'
            ? 'سيتم حذف اللجان المحددة بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.'
            : 'سيتم تغيير حالة اللجان المحددة إلى "منحلة".'
        }
        selectedCount={selectedIds.length}
        operationType={bulkOperation}
        isExecuting={isBulkExecuting}
        progress={bulkProgress}
        onConfirm={confirmBulkOperation}
        confirmVariant={bulkOperation === 'delete' ? 'destructive' : 'default'}
      />

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={importExportDialogOpen}
        onOpenChange={setImportExportDialogOpen}
        entityType="اللجان"
        onExport={handleExport}
        onImport={handleImport}
        isExporting={isExporting}
        isImporting={isImporting}
      />
    </div>
  );
}
