/**
 * Content Card Component
 * M13.1: Display content item in card format
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import {
  FileText,
  Video,
  FileImage,
  FileCheck,
  Image,
  Mic,
  Download,
  Eye,
  Heart,
  Share2,
  Clock,
  Calendar,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentItem, ContentType } from '../types/content-hub.types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';

interface ContentCardProps {
  content: ContentItem;
  onView?: (content: ContentItem) => void;
  onEdit?: (content: ContentItem) => void;
  onDelete?: (content: ContentItem) => void;
  onDownload?: (content: ContentItem) => void;
  onShare?: (content: ContentItem) => void;
  className?: string;
}

const CONTENT_TYPE_CONFIG: Record<ContentType, { icon: any; label: string; color: string }> = {
  article: { icon: FileText, label: 'مقال', color: 'text-blue-500' },
  video: { icon: Video, label: 'فيديو', color: 'text-red-500' },
  document: { icon: FileCheck, label: 'مستند', color: 'text-green-500' },
  presentation: { icon: FileImage, label: 'عرض تقديمي', color: 'text-purple-500' },
  infographic: { icon: Image, label: 'إنفوجرافيك', color: 'text-orange-500' },
  quiz: { icon: FileCheck, label: 'اختبار', color: 'text-cyan-500' },
  podcast: { icon: Mic, label: 'بودكاست', color: 'text-pink-500' },
};

const STATUS_CONFIG = {
  draft: { label: 'مسودة', variant: 'secondary' as const },
  published: { label: 'منشور', variant: 'default' as const },
  archived: { label: 'مؤرشف', variant: 'outline' as const },
  under_review: { label: 'قيد المراجعة', variant: 'secondary' as const },
};

export function ContentCard({
  content,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onShare,
  className,
}: ContentCardProps) {
  const typeConfig = CONTENT_TYPE_CONFIG[content.content_type];
  const TypeIcon = typeConfig.icon;
  const statusConfig = STATUS_CONFIG[content.status];

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn('p-2 rounded-lg bg-muted', typeConfig.color)}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-2">{content.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {content.description}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(content)}>
                  <Eye className="h-4 w-4 ml-2" />
                  عرض
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(content)}>
                  <FileText className="h-4 w-4 ml-2" />
                  تعديل
                </DropdownMenuItem>
              )}
              {onShare && (
                <DropdownMenuItem onClick={() => onShare(content)}>
                  <Share2 className="h-4 w-4 ml-2" />
                  مشاركة
                </DropdownMenuItem>
              )}
              {onDownload && content.file_url && (
                <DropdownMenuItem onClick={() => onDownload(content)}>
                  <Download className="h-4 w-4 ml-2" />
                  تحميل
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(content)}
                    className="text-destructive"
                  >
                    حذف
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          <Badge variant="outline">{typeConfig.label}</Badge>
          <Badge variant="outline">{content.category}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        {content.thumbnail_url && (
          <div className="w-full h-40 bg-muted rounded-lg mb-3 overflow-hidden">
            <img
              src={content.thumbnail_url}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {content.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
          {content.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{content.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{content.views_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{content.likes_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            <span>{content.downloads_count}</span>
          </div>
          {content.duration_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{content.duration_minutes} دقيقة</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="text-xs text-muted-foreground">
          <p>بواسطة {content.author_name}</p>
          <p className="flex items-center gap-1 mt-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(content.created_at), 'PPP', { locale: ar })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onView?.(content)}>
          <Eye className="h-4 w-4 ml-2" />
          عرض
        </Button>
      </CardFooter>
    </Card>
  );
}
