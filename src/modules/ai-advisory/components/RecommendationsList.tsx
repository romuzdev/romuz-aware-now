/**
 * M16: AI Advisory Engine - Full Recommendations List Page
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Sparkles, Search, Filter, Loader2 } from 'lucide-react';
import { useAIAdvisory } from '../hooks/useAIAdvisory';
import { useRecommendationFeedback } from '../hooks/useRecommendationFeedback';
import { useRecommendationStats } from '../hooks/useRecommendationStats';
import { RecommendationCard } from './RecommendationCard';
import type { ContextType, RecommendationStatus, RecommendationPriority } from '../types/ai-advisory.types';

export function RecommendationsList() {
  const [search, setSearch] = useState('');
  const [contextFilter, setContextFilter] = useState<ContextType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RecommendationStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<RecommendationPriority | 'all'>('all');

  const {
    recommendations,
    isLoading,
    acceptRecommendation,
    rejectRecommendation,
    implementRecommendation,
  } = useAIAdvisory({
    context_type: contextFilter !== 'all' ? contextFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    search: search || undefined,
  });

  const { stats } = useRecommendationStats();
  const { provideFeedback } = useRecommendationFeedback();

  const handleFeedback = (id: string, rating: number, comment?: string) => {
    provideFeedback({
      recommendation_id: id,
      rating,
      comment,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">التوصيات الذكية</h1>
            <p className="text-muted-foreground">
              توصيات مدعومة بالذكاء الاصطناعي لتحسين الأداء
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>الإجمالي</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>قيد المراجعة</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>تم التنفيذ</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.implemented}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>متوسط الثقة</CardDescription>
              <CardTitle className="text-3xl text-primary">
                {Math.round(stats.avg_confidence * 100)}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>تصفية النتائج</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>

            {/* Context Filter */}
            <Select value={contextFilter} onValueChange={(v: any) => setContextFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="نوع السياق" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل السياقات</SelectItem>
                <SelectItem value="risk">المخاطر</SelectItem>
                <SelectItem value="compliance">الامتثال</SelectItem>
                <SelectItem value="audit">المراجعة</SelectItem>
                <SelectItem value="campaign">حملات التوعية</SelectItem>
                <SelectItem value="policy">السياسات</SelectItem>
                <SelectItem value="action_plan">خطط العمل</SelectItem>
                <SelectItem value="incident">الحوادث</SelectItem>
                <SelectItem value="security_event">أحداث أمنية</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="accepted">مقبولة</SelectItem>
                <SelectItem value="rejected">مرفوضة</SelectItem>
                <SelectItem value="implemented">تم التنفيذ</SelectItem>
                <SelectItem value="expired">منتهية</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأولويات</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : recommendations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد توصيات تطابق معايير البحث</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                عرض {recommendations.length} توصية
              </p>
            </div>
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onAccept={acceptRecommendation}
                onReject={(id, reason) => rejectRecommendation({ id, reason })}
                onImplement={(id, notes) => implementRecommendation({ id, notes })}
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
