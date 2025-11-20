/**
 * M17: Knowledge Hub - Document Detail Page
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Edit, Trash, Shield } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { useKnowledgeDocument } from '../../hooks/useKnowledgeDocuments';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { document, isLoading } = useKnowledgeDocument(id!);

  useEffect(() => {
    if (document) {
      window.document.title = `${document.title_ar} | مركز المعرفة`;
    }
  }, [document]);

  if (isLoading) {
    return <div className="container mx-auto py-8">جاري التحميل...</div>;
  }

  if (!document) {
    return <div className="container mx-auto py-8">المستند غير موجود</div>;
  }

  return (
    <main className="container mx-auto py-8 space-y-6">
      <header className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowRight className="ml-2 h-4 w-4" />
          رجوع
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </Button>
          <Button variant="destructive">
            <Trash className="ml-2 h-4 w-4" />
            حذف
          </Button>
        </div>
      </header>

      <Card className="p-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{document.title_ar}</h1>
              {document.is_verified && (
                <Badge variant="default">
                  <Shield className="ml-1 h-3 w-3" />
                  محقق
                </Badge>
              )}
            </div>
          </div>

          {document.summary_ar && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-lg">{document.summary_ar}</p>
            </div>
          )}

          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: document.content_ar }} />
          </div>
        </div>
      </Card>
    </main>
  );
}
