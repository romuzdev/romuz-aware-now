/**
 * CatalogsPage
 * Gate-M: Catalogs management page for Platform Admin
 */

import { useState } from 'react';
import { useCatalogs, useDeleteCatalog } from '@/modules/master-data/hooks';
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
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
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

export default function CatalogsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useCatalogs();
  const deleteCatalog = useDeleteCatalog();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCatalog.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      DRAFT: 'secondary',
      PUBLISHED: 'default',
      ARCHIVED: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getScopeBadge = (scope: string) => {
    return (
      <Badge variant={scope === 'GLOBAL' ? 'default' : 'secondary'}>
        {scope === 'GLOBAL' ? 'عام' : 'خاص'}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الكتالوجات</h1>
          <p className="text-muted-foreground">إدارة كتالوجات البيانات المرجعية</p>
        </div>
        <Button onClick={() => navigate('/platform/master-data/catalogs/new')}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة كتالوج
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الرمز</TableHead>
              <TableHead>الاسم بالعربية</TableHead>
              <TableHead>الاسم بالإنجليزية</TableHead>
              <TableHead>النطاق</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإصدار</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((catalog) => (
              <TableRow key={catalog.id}>
                <TableCell className="font-mono">{catalog.code}</TableCell>
                <TableCell>{catalog.labelAr}</TableCell>
                <TableCell>{catalog.labelEn}</TableCell>
                <TableCell>{getScopeBadge(catalog.scope)}</TableCell>
                <TableCell>{getStatusBadge(catalog.status)}</TableCell>
                <TableCell>{catalog.version}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/platform/master-data/catalogs/${catalog.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/platform/master-data/catalogs/${catalog.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(catalog.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الكتالوج؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
