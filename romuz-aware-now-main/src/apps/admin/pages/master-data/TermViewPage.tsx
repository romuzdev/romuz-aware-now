/**
 * TermViewPage
 * Gate-M: Term details view page
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useTerm, useCatalog, useTerms } from '@/modules/master-data/hooks';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { ArrowRight, Edit, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function TermViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: term, isLoading } = useTerm(id || null);
  const { data: catalog } = useCatalog(term?.catalogId || null);
  const { data: parentTerm } = useTerm(term?.parentId || null);
  const { data: childTerms } = useTerms(
    term?.id ? { catalogId: term.catalogId, parentId: term.id } : undefined
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!term) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">المصطلح غير موجود</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/platform/master-data/terms')}
          >
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/platform/master-data/terms')}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{term.labelAr}</h1>
            <p className="text-muted-foreground">{term.code}</p>
          </div>
        </div>
        <Button
          onClick={() => navigate(`/platform/master-data/terms/${term.id}/edit`)}
        >
          <Edit className="h-4 w-4 ml-2" />
          تعديل
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">المعلومات الأساسية</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">الرمز</p>
              <p className="font-mono font-medium">{term.code}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">الحالة</p>
              <Badge variant={term.active ? 'default' : 'secondary'}>
                {term.active ? 'نشط' : 'غير نشط'}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">الاسم بالعربية</p>
              <p className="font-medium">{term.labelAr}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">الاسم بالإنجليزية</p>
              <p className="font-medium">{term.labelEn}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">ترتيب العرض</p>
              <p className="font-medium">{term.sortOrder}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">الكتالوج</p>
              <p className="font-medium">
                {catalog ? (
                  <button
                    onClick={() => navigate(`/platform/master-data/catalogs/${catalog.id}`)}
                    className="text-primary hover:underline"
                  >
                    {catalog.labelAr} ({catalog.code})
                  </button>
                ) : (
                  term.catalogId
                )}
              </p>
            </div>
          </div>

          {parentTerm && (
            <div>
              <p className="text-sm text-muted-foreground">المصطلح الأب</p>
              <button
                onClick={() => navigate(`/platform/master-data/terms/${parentTerm.id}`)}
                className="font-medium text-primary hover:underline"
              >
                {parentTerm.labelAr} ({parentTerm.code})
              </button>
            </div>
          )}
        </div>

        {/* Child Terms */}
        {childTerms && childTerms.length > 0 && (
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">المصطلحات الفرعية</h2>
            <div className="space-y-2">
              {childTerms.map((child) => (
                <button
                  key={child.id}
                  onClick={() => navigate(`/platform/master-data/terms/${child.id}`)}
                  className="w-full text-right p-3 border rounded hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{child.labelAr}</p>
                      <p className="text-sm text-muted-foreground">{child.code}</p>
                    </div>
                    <Badge variant={child.active ? 'default' : 'secondary'}>
                      {child.active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">البيانات الوصفية</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">تاريخ الإنشاء</p>
              <p className="font-medium">
                {format(new Date(term.createdAt), 'PPP', { locale: ar })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">آخر تحديث</p>
              <p className="font-medium">
                {format(new Date(term.updatedAt), 'PPP', { locale: ar })}
              </p>
            </div>
          </div>

          {term.attrs && Object.keys(term.attrs).length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">خصائص إضافية</p>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                {JSON.stringify(term.attrs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
