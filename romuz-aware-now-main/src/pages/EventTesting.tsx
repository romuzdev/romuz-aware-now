/**
 * Week 9-10: Event Testing Page
 * 
 * Comprehensive testing interface for event system
 */

import { useState } from 'react';
import { Card } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { EventFlowTester } from '@/components/events/EventFlowTester';
import { Badge } from '@/core/components/ui/badge';
import { Zap, Activity, TestTube } from 'lucide-react';

export default function EventTesting() {
  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TestTube className="h-8 w-8 text-primary" />
            اختبار نظام الأحداث
          </h1>
          <p className="text-muted-foreground mt-2">
            اختبر تدفق الأحداث والقواعد التلقائية بشكل تفاعلي
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Activity className="h-4 w-4" />
          بيئة الاختبار
        </Badge>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="flow-tester" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flow-tester" className="gap-2">
            <Zap className="h-4 w-4" />
            اختبار التدفق
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Activity className="h-4 w-4" />
            الأداء
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <TestTube className="h-4 w-4" />
            السجل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flow-tester">
          <EventFlowTester />
        </TabsContent>

        <TabsContent value="performance">
          <Card className="p-6">
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>اختبار الأداء قريباً</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <div className="text-center py-12 text-muted-foreground">
              <TestTube className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>سجل الاختبارات قريباً</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
