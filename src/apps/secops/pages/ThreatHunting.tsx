/**
 * Threat Hunting Page
 * M18.5 - SecOps Enhancement
 */

import { useState } from 'react';
import { PageHeader } from '@/core/components/ui/page-header';
import { Search, Plus, Play, Trash2 } from 'lucide-react';
import { useThreatHunting, useThreatHuntDashboard } from '@/modules/secops/hooks/useThreatHunting';
import { Card } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import type { ThreatHuntFilters } from '@/modules/secops/types/threat-hunting.types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ThreatHunting() {
  const [filters, setFilters] = useState<ThreatHuntFilters>({});
  const { queries, loading, executeQuery, deleteQuery } = useThreatHunting(filters);
  const { data: dashboardStats } = useThreatHuntDashboard();

  const queryTypeLabels = {
    ioc_search: 'بحث عن IOC',
    pattern_match: 'مطابقة الأنماط',
    anomaly_detection: 'كشف الشذوذ',
    correlation: 'الربط والتحليل',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Search}
        title="الصيد عن التهديدات"
        description="تنفيذ استعلامات متقدمة للبحث عن التهديدات والأنماط المشبوهة"
      />

      {/* Dashboard Statistics */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">إجمالي الاستعلامات</div>
            <div className="text-2xl font-bold">{dashboardStats.total_queries}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">الاستعلامات النشطة</div>
            <div className="text-2xl font-bold text-primary">{dashboardStats.active_queries}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">إجمالي التنفيذات</div>
            <div className="text-2xl font-bold">{dashboardStats.total_executions}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">النتائج المطابقة</div>
            <div className="text-2xl font-bold">{dashboardStats.total_matches}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            placeholder="البحث في الاستعلامات..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />

          <Select
            value={filters.query_type || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, query_type: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="نوع الاستعلام" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="ioc_search">بحث عن IOC</SelectItem>
              <SelectItem value="pattern_match">مطابقة الأنماط</SelectItem>
              <SelectItem value="anomaly_detection">كشف الشذوذ</SelectItem>
              <SelectItem value="correlation">الربط والتحليل</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.is_active?.toString() || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                is_active: value === 'all' ? undefined : value === 'true',
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="true">نشط</SelectItem>
              <SelectItem value="false">غير نشط</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Queries List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-4" />
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : queries.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {queries.map((query) => (
            <Card key={query.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{query.query_name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {query.description_ar || 'لا يوجد وصف'}
                    </p>
                  </div>
                  <Badge variant={query.is_active ? 'default' : 'secondary'}>
                    {query.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">النوع:</span>
                    <span>{queryTypeLabels[query.query_type as keyof typeof queryTypeLabels]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">التنفيذات:</span>
                    <span>{query.execution_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">النتائج:</span>
                    <span>{query.results_count}</span>
                  </div>
                  {query.last_executed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">آخر تنفيذ:</span>
                      <span className="text-xs">
                        {format(new Date(query.last_executed_at), 'PP', { locale: ar })}
                      </span>
                    </div>
                  )}
                </div>

                {query.tags && query.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {query.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => executeQuery(query.id)}
                  >
                    <Play className="h-3 w-3 ml-1" />
                    تنفيذ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('هل تريد حذف هذا الاستعلام؟')) {
                        deleteQuery(query.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">لا توجد استعلامات صيد</p>
          <p className="text-sm">ابدأ بإنشاء استعلام جديد للبحث عن التهديدات</p>
          <Button className="mt-4">
            <Plus className="h-4 w-4 ml-2" />
            إنشاء استعلام
          </Button>
        </Card>
      )}
    </div>
  );
}
