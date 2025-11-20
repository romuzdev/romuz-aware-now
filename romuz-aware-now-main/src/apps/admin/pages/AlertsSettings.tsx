/**
 * Alerts Settings Page
 * Week 4 - Phase 2
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Bell, Settings, History, Radio } from 'lucide-react';
import { AlertPoliciesList } from '@/modules/alerts/components/AlertPoliciesList';
import { AlertHistoryList } from '@/modules/alerts/components/AlertHistoryList';
import { NotificationChannelsList } from '@/modules/alerts/components/NotificationChannelsList';

export default function AlertsSettings() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">التنبيهات والإشعارات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة سياسات التنبيهات وقنوات الإشعارات
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList>
          <TabsTrigger value="policies">
            <Settings className="ml-2 h-4 w-4" />
            سياسات التنبيه
          </TabsTrigger>
          <TabsTrigger value="channels">
            <Radio className="ml-2 h-4 w-4" />
            قنوات الإشعارات
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="ml-2 h-4 w-4" />
            سجل التنبيهات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policies">
          <AlertPoliciesList />
        </TabsContent>

        <TabsContent value="channels">
          <NotificationChannelsList />
        </TabsContent>

        <TabsContent value="history">
          <AlertHistoryList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
