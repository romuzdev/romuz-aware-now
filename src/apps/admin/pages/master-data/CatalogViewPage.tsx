/**
 * CatalogViewPage
 * Gate-M: View catalog details
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useCatalog, useTerms } from '@/modules/master-data/hooks';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { ArrowRight, Edit, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';

export default function CatalogViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: catalog, isLoading: catalogLoading } = useCatalog(id || null);
  const { data: terms, isLoading: termsLoading } = useTerms(id ? { catalogId: id } : undefined);

  if (catalogLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  if (!catalog) {
    return <div className="p-6">الكتالوج غير موجود</div>;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      DRAFT: 'secondary',
      PUBLISHED: 'default',
      ARCHIVED: 'outline',
    };
    const labels: Record<string, string> = {
      DRAFT: 'مسودة',
      PUBLISHED: 'منشور',
      ARCHIVED: 'مؤرشف',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getScopeBadge = (scope: string) => {
    return (
      <Badge variant={scope === 'GLOBAL' ? 'default' : 'secondary'}>
        {scope === 'GLOBAL' ? 'عام' : 'خاص'}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/platform/master-data/catalogs')}
          >
            <ArrowRight className="h-4 w-4 ml-1" />
            رجوع
          </Button>
        </div>
        <Button onClick={() => navigate(`/platform/master-data/catalogs/${id}/edit`)}>
          <Edit className="h-4 w-4 ml-2" />
          تعديل
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>تفاصيل الكتالوج</CardTitle>
            <div className="flex gap-2">
              {getScopeBadge(catalog.scope)}
              {getStatusBadge(catalog.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">الرمز</h3>
              <p className="font-mono text-lg">{catalog.code}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">الإصدار</h3>
              <p className="text-lg">v{catalog.version}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">الاسم بالعربية</h3>
              <p className="text-lg">{catalog.labelAr}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">الاسم بالإنجليزية</h3>
              <p className="text-lg">{catalog.labelEn}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              المصطلحات ({terms?.length || 0})
            </CardTitle>
            <Button
              size="sm"
              onClick={() => navigate(`/platform/master-data/terms?catalog=${id}`)}
            >
              عرض الكل
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {termsLoading ? (
            <p className="text-muted-foreground">جاري التحميل...</p>
          ) : !terms || terms.length === 0 ? (
            <p className="text-muted-foreground">لا توجد مصطلحات في هذا الكتالوج</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرمز</TableHead>
                    <TableHead>الاسم بالعربية</TableHead>
                    <TableHead>الاسم بالإنجليزية</TableHead>
                    <TableHead>الترتيب</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terms.slice(0, 5).map((term) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {terms.length > 5 && (
                <div className="p-3 text-center border-t">
                  <Button
                    variant="link"
                    onClick={() => navigate(`/platform/master-data/terms?catalog=${id}`)}
                  >
                    عرض جميع المصطلحات ({terms.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
