/**
 * M17: Knowledge Hub - Analytics Component
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useKnowledgeAnalytics } from '@/modules/knowledge/hooks/useKnowledgeAnalytics';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { FileText, MessageSquare, Database, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/core/components/ui/skeleton';

export function KnowledgeAnalytics({ days = 30 }: { days?: number }) {
  const { data: analytics, isLoading } = useKnowledgeAnalytics(days);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!analytics) return null;

  const { queries, articles, embeddings } = analytics;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المقالات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.total}</div>
            <p className="text-xs text-muted-foreground">
              منشور: {articles.published} | موثق: {articles.verified}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاستعلامات</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queries.totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              خلال آخر {days} يوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الفائدة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queries.helpfulnessRate.toFixed(1)}%</div>
            <Progress value={queries.helpfulnessRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قطع التضمين</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{embeddings.totalChunks}</div>
            <p className="text-xs text-muted-foreground">
              {embeddings.totalArticles} مقالة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Query Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>إحصائيات الاستعلامات</CardTitle>
          <CardDescription>أداء نظام الأسئلة والأجوبة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">إجمالي الاستعلامات</p>
              <p className="text-2xl font-bold">{queries.totalQueries}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">مع تقييم</p>
              <p className="text-2xl font-bold">{queries.queriesWithFeedback}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">متوسط وقت الاستجابة</p>
              <p className="text-2xl font-bold">{queries.avgResponseTime}ms</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">مفيدة</span>
              <span className="text-sm font-medium">{queries.helpfulQueries}</span>
            </div>
            <Progress value={(queries.helpfulQueries / queries.totalQueries) * 100} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">غير مفيدة</span>
              <span className="text-sm font-medium">{queries.unhelpfulQueries}</span>
            </div>
            <Progress value={(queries.unhelpfulQueries / queries.totalQueries) * 100} />
          </div>
        </CardContent>
      </Card>

      {/* Top Queries */}
      {queries.topQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الاستعلامات الأكثر شيوعاً</CardTitle>
            <CardDescription>الأسئلة الأكثر تكراراً</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queries.topQueries.map((q: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm flex-1">{q.query}</p>
                  <Badge variant="secondary">{q.count} مرة</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles by Type */}
      <Card>
        <CardHeader>
          <CardTitle>المقالات حسب النوع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(articles.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <Badge variant="outline">{type}</Badge>
                <div className="flex items-center gap-2">
                  <Progress value={(count / articles.total) * 100} className="w-32" />
                  <span className="text-sm font-medium w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Embedding Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>إحصائيات التضمين</CardTitle>
          <CardDescription>معلومات عن البحث الدلالي</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">إجمالي القطع</p>
              <p className="text-2xl font-bold">{embeddings.totalChunks}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">متوسط القطع/مقالة</p>
              <p className="text-2xl font-bold">{embeddings.avgChunksPerArticle}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">متوسط الرموز/قطعة</p>
              <p className="text-2xl font-bold">{embeddings.avgTokensPerChunk}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
