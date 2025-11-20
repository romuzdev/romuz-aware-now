/**
 * M13.1 - Content Hub: Content Library Component
 * المكتبة الرئيسية للمحتوى مع البحث والفلترة
 */

import { useState } from 'react';
import { Search, Filter, Grid, List, Plus, Eye, Heart, Share2, Download } from 'lucide-react';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { useContentItems } from '../hooks/useContentItems';
import type { Database } from '@/integrations/supabase/types';

type ContentItem = Database['public']['Tables']['content_items']['Row'];

interface ContentLibraryProps {
  onCreateNew?: () => void;
  onItemClick?: (item: ContentItem) => void;
  onEdit?: (item: ContentItem) => void;
  showActions?: boolean;
}

export function ContentLibrary({
  onCreateNew,
  onItemClick,
  onEdit,
  showActions = true,
}: ContentLibraryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { items, loading, updateFilters, pagination, updatePagination } = useContentItems({
    status: statusFilter === 'all' ? undefined : statusFilter,
    contentType: typeFilter === 'all' ? undefined : typeFilter,
    searchQuery: searchQuery || undefined,
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    updateFilters({
      searchQuery: value || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      contentType: typeFilter === 'all' ? undefined : typeFilter,
    });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    updateFilters({
      searchQuery: searchQuery || undefined,
      status: value === 'all' ? undefined : value,
      contentType: typeFilter === 'all' ? undefined : typeFilter,
    });
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    updateFilters({
      searchQuery: searchQuery || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      contentType: value === 'all' ? undefined : value,
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-500',
      review: 'bg-blue-500',
      published: 'bg-green-500',
      archived: 'bg-orange-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getTypeIcon = (type: string) => {
    // يمكن إضافة أيقونات مخصصة لكل نوع
    return '📄';
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في المحتوى..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="review">قيد المراجعة</SelectItem>
              <SelectItem value="published">منشور</SelectItem>
              <SelectItem value="archived">مؤرشف</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="article">مقالة</SelectItem>
              <SelectItem value="video">فيديو</SelectItem>
              <SelectItem value="infographic">إنفوجرافيك</SelectItem>
              <SelectItem value="document">مستند</SelectItem>
              <SelectItem value="quiz">اختبار</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {showActions && onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء محتوى
            </Button>
          )}
        </div>
      </div>

      {/* Content Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-40 bg-muted rounded-md mb-4" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">لا يوجد محتوى</p>
          {onCreateNew && (
            <Button onClick={onCreateNew} className="mt-4">
              <Plus className="h-4 w-4 ml-2" />
              إنشاء أول محتوى
            </Button>
          )}
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              onClick={() => onItemClick?.(item)}
            >
              {/* Thumbnail */}
              {item.thumbnail_url ? (
                <div className="h-40 overflow-hidden">
                  <img
                    src={item.thumbnail_url}
                    alt={item.title_ar}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <span className="text-6xl">{getTypeIcon(item.content_type)}</span>
                </div>
              )}

              {/* Content Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                    {item.title_ar}
                  </h3>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>

                {item.content_body_ar && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.content_body_ar.substring(0, 100)}...
                  </p>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{item.views_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>{item.likes_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-4 w-4" />
                    <span>{item.shares_count}</span>
                  </div>
                </div>

                {/* Actions */}
                {showActions && onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                    }}
                  >
                    تعديل
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card
              key={item.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onItemClick?.(item)}
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.title_ar}
                    className="w-20 h-20 object-cover rounded"
                  />
                ) : (
                  <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                    <span className="text-2xl">{getTypeIcon(item.content_type)}</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{item.title_ar}</h3>
                    <Badge className={`${getStatusColor(item.status)} text-xs`}>
                      {item.status}
                    </Badge>
                  </div>
                  
                  {item.content_body_ar && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.content_body_ar.substring(0, 150)}...
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {item.views_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {item.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" /> {item.shares_count}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {showActions && onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                    }}
                  >
                    تعديل
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
