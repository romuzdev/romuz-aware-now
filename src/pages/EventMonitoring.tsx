/**
 * Event Monitoring Page
 * 
 * Comprehensive monitoring and observability for the Event System
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { EventMetricsDashboard } from '@/components/events/EventMetricsDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Activity, BarChart3, Settings } from 'lucide-react';

export default function EventMonitoring() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مراقبة نظام الأحداث</h1>
          <p className="text-muted-foreground mt-2">
            لوحة مراقبة شاملة لأداء وصحة نظام الأحداث
          </p>
        </div>
        <Activity className="h-8 w-8 text-muted-foreground" />
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            المقاييس
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            الأداء
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            التكوين
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <EventMetricsDashboard />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>مقاييس الأداء التفصيلية</CardTitle>
              <CardDescription>
                تحليل متعمق لأداء معالجة الأحداث
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                سيتم إضافة المزيد من مقاييس الأداء التفصيلية هنا
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التحسين</CardTitle>
              <CardDescription>
                تكوين معلمات الأداء والتحسين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                سيتم إضافة إعدادات التحسين هنا
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
