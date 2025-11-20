/**
 * M13.1 - Content Hub Page
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { 
  Plus, 
  Grid3x3, 
  List, 
  LayoutGrid,
  Library,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  ContentCard,
  ContentFiltersPanel,
  ContentStatsPanel,
} from '@/modules/content';
import type { ContentItem, ContentFilters, ContentStats } from '@/modules/content';
import { toast } from 'sonner';

// Mock data - في التطبيق الحقيقي سيتم جلبها من API
const mockContent: ContentItem[] = [
  {
    id: '1',
    tenant_id: 'tenant-1',
    title: 'دليل الأمن السيبراني للمبتدئين',
    description: 'دليل شامل يغطي أساسيات الأمن السيبراني والممارسات الأساسية لحماية البيانات',
    content_type: 'article',
    category: 'security',
    tags: ['أمن سيبراني', 'مبتدئين', 'حماية'],
    thumbnail_url: '',
    author_id: 'user-1',
    author_name: 'أحمد محمد',
    status: 'published',
    views_count: 1250,
    likes_count: 85,
    downloads_count: 320,
    metadata: {
      difficulty: 'beginner',
      language: 'ar',
    },
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    tenant_id: 'tenant-1',
    title: 'فيديو تعليمي: كيفية اكتشاف التصيد الاحتيالي',
    description: 'فيديو تفاعلي يوضح كيفية التعرف على رسائل التصيد الاحتيالي وتجنبها',
    content_type: 'video',
    category: 'security',
    tags: ['تصيد احتيالي', 'وعي', 'أمان'],
    video_url: 'https://example.com/video.mp4',
    duration_minutes: 15,
    author_id: 'user-2',
    author_name: 'سارة خالد',
    status: 'published',
    views_count: 2100,
    likes_count: 156,
    downloads_count: 0,
    metadata: {
      difficulty: 'beginner',
      language: 'ar',
    },
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    tenant_id: 'tenant-1',
    title: 'سياسة حماية البيانات الشخصية',
    description: 'مستند شامل يحدد سياسات وإجراءات حماية البيانات الشخصية وفقاً للمعايير الدولية',
    content_type: 'document',
    category: 'privacy',
    tags: ['خصوصية', 'بيانات', 'سياسات'],
    file_url: 'https://example.com/policy.pdf',
    author_id: 'user-3',
    author_name: 'محمد علي',
    status: 'published',
    views_count: 890,
    likes_count: 45,
    downloads_count: 567,
    metadata: {
      difficulty: 'intermediate',
      language: 'ar',
      format: 'PDF',
      file_size: 2500000,
    },
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    tenant_id: 'tenant-1',
    title: 'عرض تقديمي: إدارة الحوادث الأمنية',
    description: 'عرض تقديمي تفاعلي يشرح خطوات التعامل مع الحوادث الأمنية والاستجابة لها',
    content_type: 'presentation',
    category: 'incident_response',
    tags: ['حوادث', 'استجابة', 'إدارة'],
    file_url: 'https://example.com/presentation.pptx',
    author_id: 'user-4',
    author_name: 'فاطمة حسن',
    status: 'published',
    views_count: 670,
    likes_count: 38,
    downloads_count: 245,
    metadata: {
      difficulty: 'advanced',
      language: 'ar',
      format: 'PPTX',
    },
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockStats: ContentStats = {
  total_items: mockContent.length,
  by_type: {
    article: 1,
    video: 1,
    document: 1,
    presentation: 1,
    infographic: 0,
    quiz: 0,
    podcast: 0,
  },
  by_category: {
    security: 2,
    privacy: 1,
    incident_response: 1,
    compliance: 0,
    best_practices: 0,
    policy: 0,
    training: 0,
  },
  total_views: mockContent.reduce((sum, item) => sum + item.views_count, 0),
  total_downloads: mockContent.reduce((sum, item) => sum + item.downloads_count, 0),
  trending_items: mockContent.slice(0, 3),
  recent_items: mockContent.slice(0, 3),
};

export default function ContentHubPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ContentFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [content, setContent] = useState<ContentItem[]>(mockContent);
  const [stats, setStats] = useState<ContentStats>(mockStats);

  useEffect(() => {
    document.title = `${t('content.hub')} | Romuz`;
  }, [t]);

  const handleView = (item: ContentItem) => {
    toast.info(`عرض: ${item.title}`);
  };

  const handleEdit = (item: ContentItem) => {
    toast.info(`تعديل: ${item.title}`);
  };

  const handleDelete = (item: ContentItem) => {
    toast.info(`حذف: ${item.title}`);
  };

  const handleDownload = (item: ContentItem) => {
    toast.success(`جاري تحميل: ${item.title}`);
  };

  const handleShare = (item: ContentItem) => {
    toast.success(`تم نسخ رابط المشاركة`);
  };

  const filteredContent = content.filter((item) => {
    if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.type && filters.type.length > 0 && !filters.type.includes(item.content_type)) {
      return false;
    }
    if (filters.category && filters.category.length > 0 && !filters.category.includes(item.category)) {
      return false;
    }
    if (filters.status && filters.status.length > 0 && !filters.status.includes(item.status)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Library className="h-8 w-8 text-primary" />
            مركز المحتوى
          </h1>
          <p className="text-muted-foreground mt-2">
            مكتبة شاملة للمحتوى التدريبي والتوعوي
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setContent(mockContent)}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button>
            <Plus className="h-5 w-5 ml-2" />
            إضافة محتوى
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <ContentStatsPanel stats={stats} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <ContentFiltersPanel filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Content Grid/List */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {filteredContent.length} عنصر
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {filteredContent.length === 0 ? (
                <div className="text-center py-12">
                  <Library className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا يوجد محتوى</h3>
                  <p className="text-muted-foreground mb-4">
                    لم يتم العثور على محتوى يطابق معايير البحث
                  </p>
                  <Button onClick={() => setFilters({})}>
                    مسح الفلاتر
                  </Button>
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                      : 'space-y-4'
                  }
                >
                  {filteredContent.map((item) => (
                    <ContentCard
                      key={item.id}
                      content={item}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
