/**
 * Predictive Analytics - Dashboard
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/ui/page-header';
import { TrendingUp, Brain, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title={t('Predictive Analytics Dashboard', 'لوحة التحكم - التحليلات التنبؤية')}
        description={t('AI-powered predictions and insights', 'تنبؤات ورؤى مدعومة بالذكاء الاصطناعي')}
      />

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('Active Models', 'النماذج النشطة')}
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {t('Ready for predictions', 'جاهزة للتنبؤات')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('Total Predictions', 'إجمالي التنبؤات')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {t('All time', 'على الإطلاق')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('Average Accuracy', 'متوسط الدقة')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              {t('No data yet', 'لا توجد بيانات بعد')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('High Risk Predictions', 'تنبؤات عالية المخاطر')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {t('Requires attention', 'تحتاج انتباه')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">
            {t('Recent Predictions', 'التنبؤات الأخيرة')}
          </TabsTrigger>
          <TabsTrigger value="insights">
            {t('Key Insights', 'الرؤى الرئيسية')}
          </TabsTrigger>
          <TabsTrigger value="trends">
            {t('Trends', 'الاتجاهات')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('Recent Predictions', 'التنبؤات الأخيرة')}</CardTitle>
              <CardDescription>
                {t('Latest predictions across all models', 'آخر التنبؤات عبر جميع النماذج')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {t('No predictions yet. Create a model to get started.', 'لا توجد تنبؤات بعد. أنشئ نموذجاً للبدء.')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('Key Insights', 'الرؤى الرئيسية')}</CardTitle>
              <CardDescription>
                {t('AI-generated insights from your data', 'رؤى مُولّدة بالذكاء الاصطناعي من بياناتك')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {t('No insights available yet.', 'لا توجد رؤى متاحة بعد.')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('Prediction Trends', 'اتجاهات التنبؤات')}</CardTitle>
              <CardDescription>
                {t('Historical trends and patterns', 'الاتجاهات والأنماط التاريخية')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {t('No trend data available yet.', 'لا توجد بيانات اتجاهات متاحة بعد.')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
