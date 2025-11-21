/**
 * M16: AI Advisory Engine - Main Dashboard
 * Real-time advisory dashboard with recommendations and analytics
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { useAIAdvisory } from '@/modules/ai-advisory/hooks/useAIAdvisory';
import { useRecommendationStats } from '@/modules/ai-advisory/hooks/useRecommendationStats';
import { FeedbackAnalytics } from '@/modules/ai-advisory/components/FeedbackAnalytics';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import type { ContextType, RecommendationStatus, RecommendationPriority } from '@/modules/ai-advisory/types/ai-advisory.types';

export default function AdvisoryDashboard() {
  const [contextFilter, setContextFilter] = useState<ContextType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RecommendationStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<RecommendationPriority | 'all'>('all');

  const filters = {
    ...(contextFilter !== 'all' && { context_type: contextFilter }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
  };

  const { recommendations, isLoading, acceptRecommendation, rejectRecommendation } = useAIAdvisory(filters);
  const { stats } = useRecommendationStats();

  const getStatusIcon = (status: RecommendationStatus) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'implemented':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: RecommendationPriority) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            لوحة التوصيات الذكية
          </h1>
          <p className="text-muted-foreground mt-1">
            توصيات مدعومة بالذكاء الاصطناعي لتحسين الأمن السيبراني
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التوصيات</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معلقة</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مقبولة</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accepted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">منفذة</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.implemented}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommendations">التوصيات النشطة</TabsTrigger>
          <TabsTrigger value="analytics">تحليلات الأداء</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                الفلاتر
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Select value={contextFilter} onValueChange={(v) => setContextFilter(v as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="نوع السياق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع السياقات</SelectItem>
                  <SelectItem value="risk">المخاطر</SelectItem>
                  <SelectItem value="incident">الحوادث</SelectItem>
                  <SelectItem value="audit">التدقيق</SelectItem>
                  <SelectItem value="campaign">الحملات</SelectItem>
                  <SelectItem value="compliance">الامتثال</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="accepted">مقبولة</SelectItem>
                  <SelectItem value="rejected">مرفوضة</SelectItem>
                  <SelectItem value="implemented">منفذة</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأولويات</SelectItem>
                  <SelectItem value="critical">حرجة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Recommendations List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">لا توجد توصيات حالياً</p>
                <p className="text-sm text-muted-foreground">سيتم عرض التوصيات الجديدة هنا</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{rec.title_ar}</CardTitle>
                          {getStatusIcon(rec.status)}
                        </div>
                        <CardDescription>{rec.description_ar}</CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={getPriorityColor(rec.priority)}>
                          {rec.priority === 'critical' ? 'حرجة' :
                           rec.priority === 'high' ? 'عالية' :
                           rec.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </Badge>
                        <Badge variant="outline">{rec.context_type}</Badge>
                        {rec.confidence_score && (
                          <Badge variant="secondary">
                            ثقة: {(rec.confidence_score * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {rec.rationale_ar && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">المبرر:</p>
                        <p className="text-sm text-muted-foreground">{rec.rationale_ar}</p>
                      </div>
                    )}
                    {rec.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptRecommendation(rec.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          قبول
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectRecommendation({ id: rec.id })}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          رفض
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <FeedbackAnalytics days={30} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
