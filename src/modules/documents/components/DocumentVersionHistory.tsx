/**
 * Document Version History Component
 * M10: Smart Documents Enhancement
 * Displays all versions of a document with actions
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  History, 
  Download, 
  RotateCcw, 
  Trash2, 
  GitCompare,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card } from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
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
import { Skeleton } from '@/core/components/ui/skeleton';
import { useDocumentVersions, useRestoreVersion, useDeleteVersion } from '../hooks/useDocumentVersions';
import { useCan } from '@/core/rbac';

interface DocumentVersionHistoryProps {
  documentId: string;
  onCompare?: (version1Id: string, version2Id: string) => void;
}

export function DocumentVersionHistory({ documentId, onCompare }: DocumentVersionHistoryProps) {
  const { data: versions, isLoading, error } = useDocumentVersions(documentId);
  const restoreMutation = useRestoreVersion();
  const deleteMutation = useDeleteVersion();
  const can = useCan();
  const canManage = can('documents.manage');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);

  const handleRestore = async () => {
    if (!selectedVersionId) return;
    await restoreMutation.mutateAsync(selectedVersionId);
    setRestoreDialogOpen(false);
    setSelectedVersionId(null);
  };

  const handleDelete = async () => {
    if (!selectedVersionId) return;
    await deleteMutation.mutateAsync(selectedVersionId);
    setDeleteDialogOpen(false);
    setSelectedVersionId(null);
  };

  const handleCompareSelect = (versionId: string) => {
    if (compareVersions.includes(versionId)) {
      setCompareVersions(compareVersions.filter(id => id !== versionId));
    } else if (compareVersions.length < 2) {
      setCompareVersions([...compareVersions, versionId]);
    }
  };

  const handleCompare = () => {
    if (compareVersions.length === 2 && onCompare) {
      onCompare(compareVersions[0], compareVersions[1]);
      setCompareMode(false);
      setCompareVersions([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>فشل تحميل سجل الإصدارات: {error.message}</p>
        </div>
      </Card>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد إصدارات سابقة</h3>
          <p className="text-muted-foreground">لم يتم إنشاء أي إصدارات لهذا المستند بعد</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">سجل الإصدارات</h3>
              <p className="text-sm text-muted-foreground">
                {versions.length} إصدار متاح
              </p>
            </div>
          </div>
          
          {!compareMode && onCompare && (
            <Button
              variant="outline"
              onClick={() => setCompareMode(true)}
              disabled={versions.length < 2}
            >
              <GitCompare className="ml-2 h-4 w-4" />
              مقارنة الإصدارات
            </Button>
          )}
          
          {compareMode && (
            <div className="flex gap-2">
              <Button
                onClick={handleCompare}
                disabled={compareVersions.length !== 2}
              >
                <GitCompare className="ml-2 h-4 w-4" />
                مقارنة ({compareVersions.length}/2)
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCompareMode(false);
                  setCompareVersions([]);
                }}
              >
                إلغاء
              </Button>
            </div>
          )}
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {compareMode && <TableHead className="w-12"></TableHead>}
                <TableHead>الإصدار</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحجم</TableHead>
                <TableHead>التغييرات</TableHead>
                <TableHead>تاريخ الرفع</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version, index) => (
                <TableRow key={version.id}>
                  {compareMode && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={compareVersions.includes(version.id)}
                        onChange={() => handleCompareSelect(version.id)}
                        disabled={
                          !compareVersions.includes(version.id) &&
                          compareVersions.length >= 2
                        }
                        className="h-4 w-4"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">v{version.version_number}</span>
                      {index === 0 && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle2 className="ml-1 h-3 w-3" />
                          الحالي
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={version.is_major ? 'default' : 'secondary'}>
                      {version.is_major ? 'رئيسي' : 'فرعي'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(version.file_size_bytes)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {version.change_summary || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(version.uploaded_at), 'PPp', { locale: ar })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        title="تحميل الإصدار"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {index !== 0 && canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVersionId(version.id);
                              setRestoreDialogOpen(true);
                            }}
                            title="استعادة هذا الإصدار"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVersionId(version.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive"
                            title="حذف الإصدار"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استعادة الإصدار</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من استعادة هذا الإصدار؟ سيتم إنشاء إصدار جديد بناءً على الإصدار المحدد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending ? 'جاري الاستعادة...' : 'استعادة'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الإصدار</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الإصدار؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
