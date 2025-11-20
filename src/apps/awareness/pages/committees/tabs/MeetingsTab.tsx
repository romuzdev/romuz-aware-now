import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { fetchMeetings } from '@/modules/committees/integration';
import { useCan } from '@/core/rbac';
import { format } from 'date-fns';

interface MeetingsTabProps {
  committeeId: string;
}

export default function CommitteeMeetingsTab({ committeeId }: MeetingsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const can = useCan();

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['committee-meetings', committeeId],
    queryFn: () => fetchMeetings(committeeId),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000,
  });

  const canCreate = can('meeting.create');

  const upcomingMeetings = meetings?.filter(
    (m) => m.status === 'scheduled' || m.status === 'in_progress'
  );
  const pastMeetings = meetings?.filter(
    (m) => m.status === 'completed' || m.status === 'cancelled'
  );

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
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('meetings.upcomingMeetings')}</CardTitle>
            {canCreate && (
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t('meetings.newMeeting')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {upcomingMeetings && upcomingMeetings.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('meetings.number')}</TableHead>
                    <TableHead>{t('meetings.scheduledAt')}</TableHead>
                    <TableHead>{t('meetings.location')}</TableHead>
                    <TableHead>{t('meetings.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingMeetings.map((meeting) => (
                    <TableRow
                      key={meeting.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/awareness/meetings/${meeting.id}`)}
                    >
                      <TableCell className="font-medium">{meeting.meeting_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(meeting.scheduled_at), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>{meeting.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(meeting.status)}>
                          {t(`meetings.status.${meeting.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('meetings.noMeetings')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('meetings.pastMeetings')}</CardTitle>
        </CardHeader>
        <CardContent>
          {pastMeetings && pastMeetings.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('meetings.number')}</TableHead>
                    <TableHead>{t('meetings.scheduledAt')}</TableHead>
                    <TableHead>{t('meetings.location')}</TableHead>
                    <TableHead>{t('meetings.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastMeetings.map((meeting) => (
                    <TableRow
                      key={meeting.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/meetings/${meeting.id}`)}
                    >
                      <TableCell className="font-medium">{meeting.meeting_number}</TableCell>
                      <TableCell>
                        {format(new Date(meeting.scheduled_at), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell>{meeting.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(meeting.status)}>
                          {t(`meetings.status.${meeting.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('meetings.noMeetings')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
