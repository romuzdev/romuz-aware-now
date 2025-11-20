/**
 * Content Stats Panel
 * M13.1: Display content statistics and trends
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { FileText, Video, Eye, Download, TrendingUp, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentStats } from '../types/content-hub.types';

interface ContentStatsPanelProps {
  stats?: ContentStats;
  className?: string;
}

export function ContentStatsPanel({ stats, className }: ContentStatsPanelProps) {
  if (!stats) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-8 text-center text-muted-foreground">
          لا توجد إحصائيات متاحة
        </CardContent>
      </Card>
    );
  }

  const topType = Object.entries(stats.by_type).sort((a, b) => b[1] - a[1])[0];
  const topCategory = Object.entries(stats.by_category).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {/* Total Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            إجمالي المحتوى
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_items}</div>
          <p className="text-xs text-muted-foreground mt-1">
            عنصر محتوى
          </p>
        </CardContent>
      </Card>

      {/* Total Views */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-500" />
            إجمالي المشاهدات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_views}</div>
          <p className="text-xs text-muted-foreground mt-1">
            مشاهدة
          </p>
        </CardContent>
      </Card>

      {/* Total Downloads */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Download className="h-4 w-4 text-green-500" />
            إجمالي التحميلات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_downloads}</div>
          <p className="text-xs text-muted-foreground mt-1">
            تحميل
          </p>
        </CardContent>
      </Card>

      {/* Most Popular Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            النوع الأكثر شيوعاً
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{topType?.[1] || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            <Badge variant="outline" className="mt-1">
              {topType?.[0] || 'N/A'}
            </Badge>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
