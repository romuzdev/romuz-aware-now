/**
 * Automation Settings Page
 * Week 4 - Phase 4
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Zap, Settings, Activity } from 'lucide-react';
import { AutomationRulesList } from '@/modules/automation/components/AutomationRulesList';
import { WorkflowExecutionsList } from '@/modules/automation/components/WorkflowExecutionsList';
import { AutomationStatsCard } from '@/modules/automation/components/AutomationStatsCard';

export default function AutomationSettings() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Zap className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">الأتمتة وسير العمل</h1>
          <p className="text-muted-foreground mt-1">
            إدارة قواعد الأتمتة التلقائية وسير العمل
          </p>
        </div>
      </div>

      {/* Stats */}
      <AutomationStatsCard />

      {/* Main Content */}
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">
            <Settings className="ml-2 h-4 w-4" />
            قواعد الأتمتة
          </TabsTrigger>
          <TabsTrigger value="executions">
            <Activity className="ml-2 h-4 w-4" />
            سجل التنفيذات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <AutomationRulesList />
        </TabsContent>

        <TabsContent value="executions">
          <WorkflowExecutionsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
