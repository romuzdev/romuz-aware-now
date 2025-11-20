/**
 * Content Filters Panel
 * M13.1: Advanced filtering for content hub
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Badge } from '@/core/components/ui/badge';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Filter, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentFilters, ContentType, ContentCategory, ContentStatus } from '../types/content-hub.types';

interface ContentFiltersPanelProps {
  filters: ContentFilters;
  onFiltersChange: (filters: ContentFilters) => void;
  className?: string;
}

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'article', label: 'مقالات' },
  { value: 'video', label: 'فيديوهات' },
  { value: 'document', label: 'مستندات' },
  { value: 'presentation', label: 'عروض تقديمية' },
  { value: 'infographic', label: 'إنفوجرافيك' },
  { value: 'quiz', label: 'اختبارات' },
  { value: 'podcast', label: 'بودكاست' },
];

const CATEGORIES: { value: ContentCategory; label: string }[] = [
  { value: 'security', label: 'الأمن السيبراني' },
  { value: 'compliance', label: 'الامتثال' },
  { value: 'privacy', label: 'الخصوصية' },
  { value: 'incident_response', label: 'الاستجابة للحوادث' },
  { value: 'best_practices', label: 'أفضل الممارسات' },
  { value: 'policy', label: 'السياسات' },
  { value: 'training', label: 'التدريب' },
];

const STATUSES: { value: ContentStatus; label: string }[] = [
  { value: 'published', label: 'منشور' },
  { value: 'draft', label: 'مسودة' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'archived', label: 'مؤرشف' },
];

export function ContentFiltersPanel({ filters, onFiltersChange, className }: ContentFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState<ContentFilters>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleResetFilters = () => {
    const resetFilters: ContentFilters = {};
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFiltersCount = 
    (localFilters.type?.length || 0) +
    (localFilters.category?.length || 0) +
    (localFilters.status?.length || 0) +
    (localFilters.search ? 1 : 0);

  const toggleArrayFilter = <K extends keyof ContentFilters>(
    key: K,
    value: any
  ) => {
    setLocalFilters((prev) => {
      const currentArray = (prev[key] as any[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [key]: newArray.length > 0 ? newArray : undefined,
      };
    });
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              فلاتر المحتوى
            </CardTitle>
            <CardDescription>
              تصفية المحتوى حسب النوع والفئة والحالة
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} فلتر نشط
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'إخفاء' : 'إظهار'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              البحث
            </Label>
            <Input
              placeholder="ابحث عن محتوى..."
              value={localFilters.search || ''}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  search: e.target.value || undefined,
                }))
              }
            />
          </div>

          {/* Content Types */}
          <div className="space-y-3">
            <Label>نوع المحتوى</Label>
            <div className="space-y-2">
              {CONTENT_TYPES.map((type) => (
                <div key={type.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={localFilters.type?.includes(type.value)}
                    onCheckedChange={() => toggleArrayFilter('type', type.value)}
                  />
                  <Label htmlFor={`type-${type.value}`} className="cursor-pointer font-normal">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label>التصنيف</Label>
            <div className="space-y-2">
              {CATEGORIES.map((category) => (
                <div key={category.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`category-${category.value}`}
                    checked={localFilters.category?.includes(category.value)}
                    onCheckedChange={() => toggleArrayFilter('category', category.value)}
                  />
                  <Label
                    htmlFor={`category-${category.value}`}
                    className="cursor-pointer font-normal"
                  >
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label>الحالة</Label>
            <div className="space-y-2">
              {STATUSES.map((status) => (
                <div key={status.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={localFilters.status?.includes(status.value)}
                    onCheckedChange={() => toggleArrayFilter('status', status.value)}
                  />
                  <Label
                    htmlFor={`status-${status.value}`}
                    className="cursor-pointer font-normal"
                  >
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleApplyFilters} className="flex-1">
              <Filter className="h-4 w-4 ml-2" />
              تطبيق
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              <X className="h-4 w-4 ml-2" />
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
