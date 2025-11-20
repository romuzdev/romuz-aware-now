// ============================================================================
// Part 13.3: Notification Queue Panel
// ============================================================================

import { useState } from 'react';
import { Send, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/input';
import { useNotificationsQueue } from '@/modules/campaigns/hooks/notifications/useNotificationsQueue';
import { useNotificationTemplates } from '@/modules/campaigns/hooks/notifications/useNotificationTemplates';
import { useParticipantsList } from '@/modules/campaigns/hooks/participants/useParticipantsList';
import type { ParticipantsFilters } from '@/modules/campaigns';
import { format } from 'date-fns';

interface Props {
  campaignId: string;
}

export function QueuePanel({ campaignId }: Props) {
  const {
    queue,
    stats,
    logs,
    loading,
    canManage,
    enqueue,
    sendNow,
    retry,
    bulkRetry,
    isLoading,
  } = useNotificationsQueue(campaignId);

  const { templates } = useNotificationTemplates();

  const [showEnqueueDialog, setShowEnqueueDialog] = useState(false);
  const [enqueueTemplateKey, setEnqueueTemplateKey] = useState('');
  const [enqueueScheduledAt, setEnqueueScheduledAt] = useState('');

  // Fetch participants for enqueue
  const initialFilters: ParticipantsFilters = {
    q: '',
    status: 'all',
    scoreGte: null,
    from: '',
    to: '',
    includeDeleted: false,
    sortBy: 'employee_ref',
    sortDir: 'asc',
  };
  const { data: participantsData } = useParticipantsList({
    campaignId,
    filters: initialFilters,
    page: 1,
    pageSize: 1000,
  });

  const handleEnqueue = async () => {
    if (!participantsData || participantsData.data.length === 0) {
      alert('No participants found');
      return;
    }

    const participantIds = participantsData.data.map((p) => p.id);
    await enqueue({
      campaignId,
      participantIds,
      templateKey: enqueueTemplateKey,
      scheduledAt: enqueueScheduledAt || undefined,
    });
    setShowEnqueueDialog(false);
    setEnqueueTemplateKey('');
    setEnqueueScheduledAt('');
  };

  const handleSendNow = async (queueItemId: string) => {
    if (confirm('Send this notification now (simulated)?')) {
      await sendNow(queueItemId);
    }
  };

  const handleRetry = async (queueItemId: string) => {
    await retry(queueItemId);
  };

  const handleBulkRetry = async () => {
    if (confirm('Retry all failed notifications?')) {
      await bulkRetry();
    }
  };

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications Queue</CardTitle>
          <CardDescription>View-only access</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You don't have permission to manage notifications.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications Queue</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notifications Queue</CardTitle>
              <CardDescription>
                Pending: {stats?.pending || 0} | Sent: {stats?.sent || 0} | Failed:{' '}
                {stats?.failed || 0}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(stats?.failed || 0) > 0 && (
                <Button variant="outline" onClick={handleBulkRetry} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry All Failed
                </Button>
              )}
              <Button onClick={() => setShowEnqueueDialog(true)} disabled={isLoading}>
                <Send className="h-4 w-4 mr-2" />
                Enqueue
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!queue || queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications in queue.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.templateKey}</TableCell>
                    <TableCell className="text-xs">{item.participantId.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(item.scheduledAt), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      {item.status === 'pending' && (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                      {item.status === 'sent' && (
                        <Badge variant="default" className="gap-1 bg-success text-success-foreground">
                          <CheckCircle className="h-3 w-3" />
                          Sent
                        </Badge>
                      )}
                      {item.status === 'failed' && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {item.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendNow(item.id)}
                            disabled={isLoading}
                          >
                            Send Now
                          </Button>
                        )}
                        {item.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry(item.id)}
                            disabled={isLoading}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Logs section */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Notification Log</CardTitle>
          <CardDescription>Recent sent notifications (last 100)</CardDescription>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No logs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Transport</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">{log.templateKey}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(log.sentAt), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.transport}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.status === 'success' ? (
                        <Badge variant="default" className="bg-success text-success-foreground">Success</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Enqueue Dialog */}
      <Dialog open={showEnqueueDialog} onOpenChange={setShowEnqueueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enqueue Notifications</DialogTitle>
            <DialogDescription>
              Schedule notifications for all participants in this campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template">Template *</Label>
              <select
                id="template"
                className="w-full border rounded px-3 py-2"
                value={enqueueTemplateKey}
                onChange={(e) => setEnqueueTemplateKey(e.target.value)}
              >
                <option value="">Select template...</option>
                {templates?.map((t) => (
                  <option key={t.id} value={t.key} disabled={!t.isActive}>
                    {t.key} {!t.isActive && '(inactive)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="scheduled">Schedule (optional)</Label>
              <Input
                id="scheduled"
                type="datetime-local"
                value={enqueueScheduledAt}
                onChange={(e) => setEnqueueScheduledAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to send immediately
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              This will enqueue notifications for {participantsData?.data.length || 0} participants.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnqueueDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEnqueue}
              disabled={isLoading || !enqueueTemplateKey}
            >
              Enqueue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
