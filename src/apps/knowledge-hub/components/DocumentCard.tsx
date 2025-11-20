/**
 * M17: Knowledge Hub - DocumentCard Component
 */

import { FileText, Tag, Eye, ThumbsUp, Shield } from 'lucide-react';
import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DocumentCardProps {
  document: any;
  similarity?: number;
  showSimilarity?: boolean;
  onView?: () => void;
  onRate?: (helpful: boolean) => void;
}

const documentTypeLabels: Record<string, string> = {
  policy: 'سياسة',
  procedure: 'إجراء',
  guideline: 'إرشادات',
  standard: 'معيار',
  best_practice: 'أفضل ممارسة',
  case_study: 'دراسة حالة',
  regulation: 'نظام',
  faq: 'أسئلة شائعة',
  training: 'تدريب',
  template: 'قالب',
};

export function DocumentCard({
  document,
  similarity,
  showSimilarity,
  onView,
  onRate,
}: DocumentCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{document.title_ar}</h3>
              {document.is_verified && (
                <Shield className="h-4 w-4 text-green-600" />
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">
                {documentTypeLabels[document.document_type] || document.document_type}
              </Badge>
              <Badge variant="secondary">{document.category}</Badge>
              {document.tags?.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 ml-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {showSimilarity && similarity !== undefined && (
            <div className="text-left">
              <div className="text-2xl font-bold text-primary">
                {Math.round(similarity * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">تطابق</div>
            </div>
          )}
        </div>

        {/* Summary */}
        {document.summary_ar && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {document.summary_ar}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {document.views_count || 0}
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              {document.helpful_count || 0}
            </div>
            {document.usefulness_score > 0 && (
              <div className="flex items-center gap-2">
                <Progress value={document.usefulness_score * 20} className="w-16 h-2" />
                <span className="text-xs">
                  {document.usefulness_score.toFixed(1)}/5
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onRate && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRate(true)}
                >
                  <ThumbsUp className="h-4 w-4 ml-1" />
                  مفيد
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRate(false)}
                >
                  مفيد
                </Button>
              </>
            )}
            {onView && (
              <Button variant="default" size="sm" onClick={onView}>
                عرض
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
