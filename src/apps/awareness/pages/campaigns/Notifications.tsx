// ============================================================================
// Part 13.3: Campaign Notifications Page
// ============================================================================

import { useParams } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { TemplatesPanel } from '@/modules/campaigns/components/notifications/TemplatesPanel';
import { QueuePanel } from '@/modules/campaigns/components/notifications/QueuePanel';
import { SchedulerSettings } from '@/modules/campaigns/components/notifications/SchedulerSettings';

export default function CampaignNotificationsPage() {
  const { id: campaignId } = useParams<{ id: string }>();

  if (!campaignId) {
    return (
      <div className="p-8">
        <p className="text-destructive">Campaign ID required</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">Campaign Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Manage templates, queue, and delivery settings
          </p>
        </div>
      </div>

      <TemplatesPanel />
      <QueuePanel campaignId={campaignId} />
      <SchedulerSettings />
    </div>
  );
}
