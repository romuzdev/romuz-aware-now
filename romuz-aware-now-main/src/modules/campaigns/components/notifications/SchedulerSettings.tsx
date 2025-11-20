// ============================================================================
// Part 13.4: Scheduler Placeholder Component
// ============================================================================

import { Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Switch } from '@/core/components/ui/switch';
import { Label } from '@/core/components/ui/label';

export function SchedulerSettings() {
  // Placeholder: no-op toggle for now
  // Future: integrate with backend cron/scheduler service

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduler Settings</CardTitle>
        <CardDescription>Configure automated notification delivery</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            The notification scheduler is handled by a backend service (Supabase cron or external
            scheduler). It processes the notification queue every few minutes and delivers pending
            messages automatically.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
          <Switch id="auto-scheduler" disabled checked={false} />
          <Label htmlFor="auto-scheduler">Enable auto scheduler (coming soon)</Label>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong>Future Integration:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Backend cron job checks <code>notification_queue</code> every X minutes</li>
            <li>Sends messages via email/SMS/webhook provider</li>
            <li>Updates queue status and writes to <code>notification_log</code></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
