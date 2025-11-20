/**
 * MappingViewPage - View Mapping Details
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/core/components/ui/page-header';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Badge } from '@/core/components/ui/badge';
import { useMapping, useDeleteMapping } from '@/modules/master-data/hooks/useMappings';
import { useCatalog } from '@/modules/master-data/hooks/useCatalogs';
import { useTerm } from '@/modules/master-data/hooks/useTerms';

export default function MappingViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: mapping, isLoading } = useMapping(id || '');
  const { data: catalog } = useCatalog(mapping?.catalogId || null);
  const { data: term } = useTerm(mapping?.termId || null);
  const deleteMutation = useDeleteMapping();

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('هل أنت متأكد من حذف هذا الربط؟')) return;

    await deleteMutation.mutateAsync(id);
    navigate('/platform/master-data/mappings');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!mapping) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">لم يتم العثور على الربط</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="تفاصيل الربط"
        description="عرض تفاصيل ربط النظام الخارجي"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/platform/master-data/mappings')}
            >
              <ArrowRight className="h-4 w-4 ml-2" />
              رجوع
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/platform/master-data/mappings/${id}/edit`)}
            >
              <Edit className="h-4 w-4 ml-2" />
              تعديل
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف
            </Button>
          </div>
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الكتالوج</p>
                <p className="text-base font-medium">
                  {catalog ? `${catalog.labelAr} (${catalog.code})` : mapping.catalogId}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">المصطلح</p>
                <p className="text-base font-medium">
                  {term ? `${term.labelAr} (${term.code})` : mapping.termId || '-'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">النظام المصدر</p>
                <Badge variant="outline">{mapping.sourceSystem}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">كود المصدر</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">{mapping.srcCode}</code>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">كود الهدف</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">{mapping.targetCode}</code>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</p>
                <p className="text-sm">{new Date(mapping.createdAt).toLocaleDateString('ar')}</p>
              </div>
            </div>

            {mapping.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">ملاحظات</p>
                <p className="text-sm bg-muted p-3 rounded">{mapping.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
