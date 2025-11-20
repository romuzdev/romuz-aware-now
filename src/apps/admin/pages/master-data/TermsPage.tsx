/**
 * TermsPage
 * Gate-M: Terms management page for Platform Admin
 */

import { useState, useMemo } from 'react';
import { useTerms, useDeleteTerm } from '@/modules/master-data/hooks';
import { CatalogSelector, TermsTreeView, BulkImportDialog } from '@/modules/master-data/components';
import { Button } from '@/core/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { Plus, Edit, Trash2, GitBranch, Upload, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

export default function TermsPage() {
  const navigate = useNavigate();
  const [catalogId, setCatalogId] = useState<string>('');
  const { data, isLoading } = useTerms(catalogId ? { catalogId } : undefined);
  const deleteTerm = useDeleteTerm();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('tree');
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTerm.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المصطلحات</h1>
          <p className="text-muted-foreground">إدارة مصطلحات الكتالوجات</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'tree' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tree')}
          >
            <GitBranch className="h-4 w-4 ml-2" />
            شجرة
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            جدول
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setImportDialogOpen(true)}
            disabled={!catalogId}
          >
            <Upload className="h-4 w-4 ml-2" />
            استيراد
          </Button>
          <Button
            onClick={() => navigate('/platform/master-data/terms/new')}
            disabled={!catalogId}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مصطلح
          </Button>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <label className="text-sm font-medium mb-2 block">اختر الكتالوج</label>
        <CatalogSelector
          value={catalogId}
          onValueChange={setCatalogId}
          placeholder="اختر كتالوج لعرض المصطلحات"
        />
      </div>

      {catalogId && viewMode === 'tree' && (
        <TermsTreeView
          terms={data || []}
          onEdit={(term) => navigate(`/platform/master-data/terms/${term.id}/edit`)}
          onDelete={(id) => setDeleteId(id)}
          onView={(term) => navigate(`/platform/master-data/terms/${term.id}`)}
        />
      )}

      {catalogId && viewMode === 'table' && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرمز</TableHead>
                <TableHead>الاسم بالعربية</TableHead>
                <TableHead>الاسم بالإنجليزية</TableHead>
                <TableHead>الترتيب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    لا توجد مصطلحات
                  </TableCell>
                </TableRow>
              ) : (
                data?.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-mono">{term.code}</TableCell>
                    <TableCell>{term.labelAr}</TableCell>
                    <TableCell>{term.labelEn}</TableCell>
                    <TableCell>{term.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={term.active ? 'default' : 'secondary'}>
                        {term.active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => navigate(`/platform/master-data/terms/${term.id}`)}
                           title="عرض التفاصيل"
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() =>
                             navigate(`/platform/master-data/terms/${term.id}/edit`)
                           }
                           title="تعديل"
                         >
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => setDeleteId(term.id)}
                           title="حذف"
                         >
                           <Trash2 className="h-4 w-4 text-destructive" />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {deleteId && (
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا المصطلح؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Import Dialog */}
      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        entityType="terms"
        catalogId={catalogId}
      />
    </div>
  );
}
