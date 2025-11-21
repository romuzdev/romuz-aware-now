/**
 * M17: Knowledge Hub - Main Hub Page
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import { useKnowledgeArticles, useTrendingArticles } from '@/modules/knowledge/hooks/useKnowledgeArticles';
import { ArticleCard } from '@/modules/knowledge/components/ArticleCard';
import { RAGQueryInterface } from '@/modules/knowledge/components/RAGQueryInterface';
import { KnowledgeAnalytics } from '@/modules/knowledge/components/KnowledgeAnalytics';
import { Brain, Search, TrendingUp, Filter } from 'lucide-react';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function KnowledgeHub() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filters = {
    isPublished: true,
    ...(searchQuery && { searchQuery }),
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
    ...(typeFilter !== 'all' && { documentType: typeFilter }),
  };

  const { data: articles, isLoading } = useKnowledgeArticles(filters);
  const { data: trendingArticles } = useTrendingArticles(5);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            مركز المعرفة
          </h1>
          <p className="text-muted-foreground mt-1">
            قاعدة معرفة ذكية مع بحث دلالي وأسئلة وأجوبة بالذكاء الاصطناعي
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">تصفح المقالات</TabsTrigger>
          <TabsTrigger value="qa">الأسئلة والأجوبة</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                البحث والفلترة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="ابحث في المقالات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  بحث
                </Button>
              </div>

              <div className="flex gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    <SelectItem value="security">الأمن السيبراني</SelectItem>
                    <SelectItem value="compliance">الامتثال</SelectItem>
                    <SelectItem value="governance">الحوكمة</SelectItem>
                    <SelectItem value="risk">إدارة المخاطر</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="نوع المستند" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="policy">سياسة</SelectItem>
                    <SelectItem value="procedure">إجراء</SelectItem>
                    <SelectItem value="guideline">دليل</SelectItem>
                    <SelectItem value="best_practice">أفضل ممارسة</SelectItem>
                    <SelectItem value="faq">أسئلة شائعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Trending Articles */}
          {trendingArticles && trendingArticles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  المقالات الأكثر شيوعاً
                </CardTitle>
                <CardDescription>المقالات الأكثر مشاهدة وبحثاً</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trendingArticles.slice(0, 3).map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onView={(id) => navigate(`/knowledge-hub/article/${id}`)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Articles Grid */}
          <Card>
            <CardHeader>
              <CardTitle>المقالات</CardTitle>
              <CardDescription>
                {articles?.length || 0} مقالة متاحة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-64 w-full" />
                  ))}
                </div>
              ) : articles && articles.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onView={(id) => navigate(`/knowledge-hub/article/${id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">لا توجد مقالات مطابقة للفلاتر</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qa">
          <RAGQueryInterface />
        </TabsContent>

        <TabsContent value="analytics">
          <KnowledgeAnalytics days={30} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
