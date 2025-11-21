/**
 * M18: Incident Management Page
 * Main page for incident response management
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
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
          <div className="text-center text-muted-foreground py-12">
            جاري تطوير عرض الجدول الزمني...
          </div>
        </TabsContent>

        <TabsContent value="sla" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            جاري تطوير متابعة SLA...
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            جاري تطوير الإحصائيات...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
