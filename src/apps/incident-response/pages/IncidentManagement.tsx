/**
 * M18: Incident Management Page
 * Main page for incident response management
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Plus } from 'lucide-react';
import { IncidentBoard } from '@/modules/incident-response/components/IncidentBoard';

export default function IncidentManagement() {
  const [activeTab, setActiveTab] = useState('board');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الحوادث الأمنية</h1>
          <p className="text-muted-foreground mt-1">
            إدارة ومتابعة الحوادث الأمنية مع SLA والتكامل الكامل
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          حادثة جديدة
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="board">لوحة الحوادث</TabsTrigger>
          <TabsTrigger value="timeline">الجدول الزمني</TabsTrigger>
          <TabsTrigger value="sla">متابعة SLA</TabsTrigger>
          <TabsTrigger value="statistics">الإحصائيات</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <IncidentBoard />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>الجدول الزمني للحوادث</CardTitle>
              <CardDescription>
                عرض زمني لجميع الحوادث الأمنية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border-r-4 border-red-500 bg-muted/50 rounded">
                  <div className="text-center">
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground">حرجة</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">28</p>
                    <p className="text-xs text-muted-foreground">عالية</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">45</p>
                    <p className="text-xs text-muted-foreground">متوسطة</p>
                  </div>
                  <div className="flex-1 text-muted-foreground text-sm">
                    عرض تفاعلي للأحداث الزمنية متاح قريباً
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>متابعة SLA</CardTitle>
              <CardDescription>
                مراقبة اتفاقيات مستوى الخدمة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">وقت الاستجابة المتوسط</p>
                    <p className="text-2xl font-bold mt-2">15 دقيقة</p>
                    <Badge className="mt-2" variant="default">ضمن الحدود</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">وقت الحل المتوسط</p>
                    <p className="text-2xl font-bold mt-2">4.5 ساعة</p>
                    <Badge className="mt-2" variant="secondary">جيد</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">تجاوز SLA</p>
                    <p className="text-2xl font-bold mt-2">2</p>
                    <Badge className="mt-2" variant="outline">منخفض</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الحوادث</CardTitle>
              <CardDescription>
                تحليلات شاملة للحوادث الأمنية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold">85</p>
                  <p className="text-sm text-muted-foreground mt-1">إجمالي الحوادث</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-green-600">62</p>
                  <p className="text-sm text-muted-foreground mt-1">محلولة</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">18</p>
                  <p className="text-sm text-muted-foreground mt-1">قيد التحقيق</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-red-600">5</p>
                  <p className="text-sm text-muted-foreground mt-1">مفتوحة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
