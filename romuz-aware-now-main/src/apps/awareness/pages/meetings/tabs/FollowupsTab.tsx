import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { fetchFollowupsByMeeting } from '@/modules/committees/integration';
import { useCan } from '@/core/rbac';
import { format, isPast } from 'date-fns';

interface FollowupsTabProps {
  meetingId: string;
}

export default function MeetingFollowupsTab({ meetingId }: FollowupsTabProps) {
  const { t } = useTranslation();
  const can = useCan();

  const { data: followups, isLoading } = useQuery({
    queryKey: ['meeting-followups', meetingId],
    queryFn: () => fetchFollowupsByMeeting(meetingId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000,
  });

  const canManage = can('followup.manage');

  const getFollowupStatus = (followup: any) => {
    if (followup.status === 'completed') return 'completed';
    if (followup.status === 'in_progress') return 'in_progress';
    if (followup.due_date && isPast(new Date(followup.due_date))) return 'overdue';
    return 'open';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const groupedFollowups = {
    open: followups?.filter((f) => getFollowupStatus(f) === 'open') || [],
    in_progress: followups?.filter((f) => getFollowupStatus(f) === 'in_progress') || [],
    completed: followups?.filter((f) => getFollowupStatus(f) === 'completed') || [],
    overdue: followups?.filter((f) => getFollowupStatus(f) === 'overdue') || [],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('meetings.followups.title')}</CardTitle>
          {canManage && (
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('meetings.actions.addDecision')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['open', 'in_progress', 'completed', 'overdue'].map((status) => (
            <div key={status} className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon(status)}
                <h3 className="font-semibold">
                  {t(`meetings.followups.${status}`)} ({groupedFollowups[status as keyof typeof groupedFollowups].length})
                </h3>
              </div>
              <div className="space-y-2">
                {groupedFollowups[status as keyof typeof groupedFollowups].map((followup) => (
                  <div key={followup.id} className="p-3 border rounded-lg bg-card">
                    <p className="text-sm font-medium line-clamp-2 mb-2">
                      {followup.description}
                    </p>
                    {followup.assigned_to_user_id && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {t('meetings.followups.assignedTo')}: {followup.assigned_to_user_id}
                      </p>
                    )}
                    {followup.due_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(followup.due_date), 'yyyy-MM-dd')}
                      </div>
                    )}
                    <Badge
                      variant={getStatusBadgeVariant(status)}
                      className="mt-2 text-xs"
                    >
                      {t(`meetings.followups.${status}`)}
                    </Badge>
                  </div>
                ))}
                {groupedFollowups[status as keyof typeof groupedFollowups].length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('meetings.followups.noFollowups')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
