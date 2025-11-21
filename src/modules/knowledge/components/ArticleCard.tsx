/**
 * M17: Knowledge Hub - Article Card Component
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Eye, ThumbsUp, ThumbsDown, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ArticleCardProps {
  article: {
    id: string;
    title_ar: string;
    summary_ar?: string | null;
    category: string;
    document_type: string;
    is_published: boolean;
    is_verified: boolean;
    view_count: number;
    helpful_count: number;
    not_helpful_count: number;
    created_at: string;
    tags?: string[] | null;
  };
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function ArticleCard({ article, onView, onEdit }: ArticleCardProps) {
  const documentTypeLabels: Record<string, string> = {
    policy: 'سياسة',
    procedure: 'إجراء',
    guideline: 'دليل',
    standard: 'معيار',
    best_practice: 'أفضل ممارسة',
    case_study: 'دراسة حالة',
    regulation: 'نظام',
    faq: 'أسئلة شائعة',
    training: 'تدريب',
    template: 'نموذج',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              {article.is_verified && (
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              )}
              <CardTitle className="line-clamp-2">{article.title_ar}</CardTitle>
            </div>
            {article.summary_ar && (
              <CardDescription className="line-clamp-3">
                {article.summary_ar}
              </CardDescription>
            )}
          </div>
          <Badge variant={article.is_published ? 'default' : 'secondary'}>
            {article.is_published ? 'منشور' : 'مسودة'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            <FileText className="h-3 w-3 mr-1" />
            {documentTypeLabels[article.document_type] || article.document_type}
          </Badge>
          <Badge variant="outline">{article.category}</Badge>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {article.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{article.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{article.view_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4 text-green-600" />
            <span>{article.helpful_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="h-4 w-4 text-red-600" />
            <span>{article.not_helpful_count}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          تم الإنشاء: {format(new Date(article.created_at), 'dd MMMM yyyy', { locale: ar })}
        </p>
      </CardContent>

      <CardFooter className="flex gap-2">
        {onView && (
          <Button variant="default" size="sm" onClick={() => onView(article.id)} className="flex-1">
            عرض
          </Button>
        )}
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(article.id)} className="flex-1">
            تعديل
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
