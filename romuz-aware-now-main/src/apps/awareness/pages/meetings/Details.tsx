import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit, Trash2, Lock } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { fetchMeetingById } from '@/modules/committees/integration';
import { useCan } from '@/core/rbac';
import { format } from 'date-fns';
import MeetingAgendaTab from './tabs/AgendaTab';
import MeetingDecisionsTab from './tabs/DecisionsTab';
import MeetingFollowupsTab from './tabs/FollowupsTab';

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const can = useCan();

  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => fetchMeetingById(id!),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000,
  });

  const canManage = can('meeting.manage');
  const canClose = can('meeting.close');

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">{t('meetings.error.fetch')}</div>
      </div>
    );
  }

  const isClosed = meeting.status === 'completed' || meeting.status === 'cancelled';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/committees/${meeting.committee_id}`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {t('meetings.meetingDetails')} #{meeting.meeting_number}
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(meeting.scheduled_at), 'yyyy-MM-dd HH:mm')}
          </p>
        </div>
        {canManage && !isClosed && (
          <Button variant="outline" onClick={() => navigate(`/admin/meetings/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            {t('meetings.actions.edit')}
          </Button>
        )}
        {canClose && !isClosed && (
          <Button onClick={() => {}}>
            <Lock className="w-4 h-4 mr-2" />
            {t('meetings.actions.closeMeeting')}
          </Button>
        )}
        {canManage && (
          <Button variant="destructive" onClick={() => {}}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t('meetings.actions.delete')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('meetings.meetingDetails')}</CardTitle>
          <CardDescription>
            {t('meetings.location')}: {meeting.location || '-'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(meeting.status)}>
                {t(`meetings.status.${meeting.status}`)}
              </Badge>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">{t('meetings.agenda.title')}: </span>
              <span className="font-medium">{meeting.agenda_items_count || 0}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">{t('meetings.decisions.title')}: </span>
              <span className="font-medium">{meeting.decisions_count || 0}</span>
            </div>
          </div>
          {meeting.notes && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{meeting.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="agenda" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agenda">{t('meetings.tabs.agenda')}</TabsTrigger>
          <TabsTrigger value="decisions">{t('meetings.tabs.decisions')}</TabsTrigger>
          <TabsTrigger value="followups">{t('meetings.tabs.followups')}</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda">
          <MeetingAgendaTab meetingId={id!} />
        </TabsContent>

        <TabsContent value="decisions">
          <MeetingDecisionsTab meetingId={id!} />
        </TabsContent>

        <TabsContent value="followups">
          <MeetingFollowupsTab meetingId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
