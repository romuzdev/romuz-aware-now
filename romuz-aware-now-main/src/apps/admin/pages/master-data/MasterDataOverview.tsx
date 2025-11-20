/**
 * Master Data Overview Page
 * Gateway to all Master Data & Taxonomy Hub features
 */

import { Database, Folder, List, Link, Settings, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function MasterDataOverview() {
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-gate-m-demo', { method: 'POST' });

      if (error) throw error;

      toast.success('تم بنجاح', {
        description: `تم إنشاء ${data.summary.catalogs} كتالوجات، ${data.summary.terms} مصطلح، ${data.summary.mappings} ربط`,
      });
    } catch (error) {
      console.error('Seeding error:', error);
      toast.error('خطأ', {
        description: (error as Error).message || 'فشل إنشاء البيانات التجريبية',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const features = [
    {
      id: 'catalogs',
      title: 'الكتالوجات',
      titleEn: 'Catalogs',
      description: 'إدارة كتالوجات البيانات المرجعية والتصنيفات',
      descriptionEn: 'Manage reference data catalogs and taxonomies',
      icon: Folder,
      route: '/platform/master-data/catalogs',
      color: 'text-blue-500',
    },
    {
      id: 'terms',
      title: 'المصطلحات',
      titleEn: 'Terms',
      description: 'إدارة المصطلحات والهيكل الهرمي',
      descriptionEn: 'Manage terms and hierarchical structure',
      icon: List,
      route: '/platform/master-data/terms',
      color: 'text-green-500',
    },
    {
      id: 'mappings',
      title: 'الربط والتكامل',
      titleEn: 'Mappings',
      description: 'ربط المصطلحات مع الأنظمة الخارجية',
      descriptionEn: 'Map terms with external systems',
      icon: Link,
      route: '/platform/master-data/mappings',
      color: 'text-purple-500',
    },
    {
      id: 'acceptance',
      title: 'اختبار القبول',
      titleEn: 'Acceptance Tests',
      description: 'تشغيل اختبارات القبول الشاملة للنظام',
      descriptionEn: 'Run comprehensive acceptance tests',
      icon: Settings,
      route: '/platform/master-data/acceptance',
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gate-M: Master Data Hub</h1>
            <p className="text-muted-foreground mt-1">
              مركز إدارة البيانات الأساسية والتصنيفات
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSeedDemoData}
          disabled={isSeeding}
          variant="outline"
          size="lg"
        >
          <Sparkles className="ml-2 h-5 w-5" />
          {isSeeding ? 'جاري الإنشاء...' : 'إنشاء بيانات تجريبية'}
        </Button>
      </div>

      {/* Introduction Card */}
      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة</CardTitle>
          <CardDescription>
            نظام Gate-M يوفر مركزًا موحدًا لإدارة جميع القوائم المرجعية والتصنيفات المستخدمة عبر المنصة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold">الوظائف الرئيسية:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>إدارة الكتالوجات (Platform & Tenant)</li>
                <li>هيكل هرمي للمصطلحات (Parent-Child)</li>
                <li>الربط مع الأنظمة الخارجية</li>
                <li>إصدارات متعددة للكتالوجات</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">الأمان والصلاحيات:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Row Level Security (RLS) كامل</li>
                <li>فصل Platform عن Tenant</li>
                <li>تدقيق شامل للعمليات (Audit Log)</li>
                <li>صلاحيات مرنة حسب الدور</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{feature.titleEn}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {feature.descriptionEn}
                </p>
                <Button 
                  onClick={() => navigate(feature.route)}
                  className="w-full"
                >
                  فتح
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>حالة النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-blue-500">Ready</p>
              <p className="text-sm text-muted-foreground mt-1">النظام جاهز</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-500">7/7</p>
              <p className="text-sm text-muted-foreground mt-1">RPC Functions</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-500">100%</p>
              <p className="text-sm text-muted-foreground mt-1">RLS Coverage</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-orange-500">v1.0</p>
              <p className="text-sm text-muted-foreground mt-1">إصدار النظام</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
