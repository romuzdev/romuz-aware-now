/**
 * M17: Knowledge Hub - Main Index Page
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, MessageCircle, Network, Plus, TrendingUp } from 'lucide-react';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { KnowledgeSearch } from '../components/KnowledgeSearch';
import { QAInterface } from '../components/QAInterface';
import { useKnowledgeDocuments } from '../hooks/useKnowledgeDocuments';

export default function KnowledgeHubIndex() {
  useEffect(() => {
    document.title = 'مركز المعرفة | Romuz';
  }, []);

  const { stats, documents } = useKnowledgeDocuments({ limit: 5, isVerified: true });

  return (
    <main className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <BookOpen className="h-10 w-10 text-primary" />
              مركز المعرفة
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              مكتبة ذكية مع بحث دلالي ونظام أسئلة وأجوبة بالذكاء الاصطناعي
            </p>
          </div>
          <Link to="/knowledge-hub/documents/create">
            <Button size="lg">
              <Plus className="ml-2 h-5 w-5" />
              إضافة مستند
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المستندات</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalDocuments}</p>
                </div>
                <BookOpen className="h-10 w-10 text-primary opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مستندات محققة</p>
                  <p className="text-3xl font-bold mt-1">{stats.verifiedDocuments}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الأسئلة</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalQuestions}</p>
                </div>
                <MessageCircle className="h-10 w-10 text-blue-600 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجابات مفيدة</p>
                  <p className="text-3xl font-bold mt-1">{stats.helpfulAnswers}</p>
                </div>
                <Search className="h-10 w-10 text-purple-600 opacity-20" />
              </div>
            </Card>
          </div>
        )}
      </header>

      {/* Main Tabs */}
      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="search">
            <Search className="ml-2 h-4 w-4" />
            البحث الذكي
          </TabsTrigger>
          <TabsTrigger value="qa">
            <MessageCircle className="ml-2 h-4 w-4" />
            اسأل سؤال
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <KnowledgeSearch />
        </TabsContent>

        <TabsContent value="qa">
          <QAInterface />
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/knowledge-hub/documents">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <BookOpen className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-2">تصفح المستندات</h3>
            <p className="text-sm text-muted-foreground">
              استعرض جميع المستندات المعرفية المنظمة حسب الفئات والأنواع
            </p>
          </Card>
        </Link>

        <Link to="/knowledge-hub/graph">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <Network className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">الرسم البياني المعرفي</h3>
            <p className="text-sm text-muted-foreground">
              استكشف العلاقات بين المستندات المختلفة بشكل تفاعلي
            </p>
          </Card>
        </Link>

        <Link to="/knowledge-hub/documents/create">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-dashed border-2">
            <Plus className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg mb-2">إضافة مستند جديد</h3>
            <p className="text-sm text-muted-foreground">
              أضف مستند معرفي جديد إلى المكتبة
            </p>
          </Card>
        </Link>
      </div>
    </main>
  );
}
