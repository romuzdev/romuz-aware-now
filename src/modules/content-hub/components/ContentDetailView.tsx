/**
 * M13.1 - Content Hub: Content Detail View
 * صفحة عرض تفاصيل المحتوى مع التفاعلات والتعليقات
 */

import { useState, useEffect } from 'react';
import { ArrowRight, Calendar, User, Tag, Clock } from 'lucide-react';
import { Card, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { ContentInteractionBar } from './ContentInteractionBar';
import { ContentCommentsSection } from './ContentCommentsSection';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type ContentItem = Database['public']['Tables']['content_items']['Row'];

interface ContentDetailViewProps {
  content: ContentItem;
  onBack?: () => void;
}

export function ContentDetailView({ content, onBack }: ContentDetailViewProps) {
  const [readingTime, setReadingTime] = useState(0);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    // Calculate reading time (assuming 200 words per minute for Arabic)
    if (content.content_body_ar) {
      const words = content.content_body_ar.split(/\s+/).length;
      const minutes = Math.ceil(words / 200);
      setReadingTime(minutes);
    }
  }, [content.content_body_ar]);

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-500',
      review: 'bg-blue-500',
      published: 'bg-green-500',
      archived: 'bg-orange-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    const text = {
      draft: 'مسودة',
      review: 'قيد المراجعة',
      published: 'منشور',
      archived: 'مؤرشف',
    };
    return text[status as keyof typeof text] || status;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button variant="ghost" onClick={onBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
      )}

      {/* Main Content Card */}
      <Card>
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            {/* Meta Info */}
            <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
              <Badge className={getStatusColor(content.status)}>
                {getStatusText(content.status)}
              </Badge>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(content.created_at), {
                    addSuffix: true,
                    locale: ar,
                  })}
                </span>
              </div>
              {content.author_id && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>المؤلف</span>
                  </div>
                </>
              )}
              {readingTime > 0 && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{readingTime} دقائق قراءة</span>
                  </div>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold" dir="rtl">
              {content.title_ar}
            </h1>

            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {content.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Featured Image */}
          {content.thumbnail_url && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={content.thumbnail_url}
                alt={content.title_ar}
                className="w-full h-auto object-cover max-h-[400px]"
              />
            </div>
          )}

          {/* Content Body */}
          <div
            className="prose prose-lg max-w-none"
            dir="rtl"
            dangerouslySetInnerHTML={{ __html: content.content_body_ar || '' }}
          />

          {/* English Content (if available) */}
          {content.title_en && content.content_body_en && (
            <div className="mt-8 pt-8 border-t space-y-4">
              <h2 className="text-2xl font-bold">{content.title_en}</h2>
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: content.content_body_en }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interaction Bar */}
      <ContentInteractionBar
        contentId={content.id}
        contentTitle={content.title_ar}
        stats={{
          views: content.views_count || 0,
          likes: content.likes_count || 0,
          shares: content.shares_count || 0,
          bookmarks: content.bookmark_count || 0,
          comments: content.comment_count || 0,
        }}
        onCommentClick={() => setShowComments(!showComments)}
      />

      {/* Comments Section */}
      {showComments && <ContentCommentsSection contentId={content.id} />}

      {/* SEO Metadata (for admins) */}
      {content.seo_title && (
        <Card className="bg-muted/30">
          <CardContent className="p-6 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              معلومات SEO
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">العنوان:</span> {content.seo_title}
              </div>
              {content.seo_description && (
                <div>
                  <span className="font-medium">الوصف:</span>{' '}
                  {content.seo_description}
                </div>
              )}
              {content.seo_keywords && content.seo_keywords.length > 0 && (
                <div>
                  <span className="font-medium">الكلمات المفتاحية:</span>{' '}
                  {content.seo_keywords.join(', ')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
