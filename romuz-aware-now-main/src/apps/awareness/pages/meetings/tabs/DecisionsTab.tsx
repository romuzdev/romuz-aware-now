import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
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
import { fetchDecisions } from '@/modules/committees/integration';
import { useCan } from '@/core/rbac';

interface DecisionsTabProps {
  meetingId: string;
}

export default function MeetingDecisionsTab({ meetingId }: DecisionsTabProps) {
  const { t } = useTranslation();
  const can = useCan();

  const { data: decisions, isLoading } = useQuery({
    queryKey: ['meeting-decisions', meetingId],
    queryFn: () => fetchDecisions(meetingId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000,
  });

  const canCreate = can('decision.create');

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
          <CardTitle>{t('meetings.decisions.title')}</CardTitle>
          {canCreate && (
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('meetings.actions.addDecision')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {decisions && decisions.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('meetings.decisions.decisionText')}</TableHead>
                  <TableHead>{t('meetings.decisions.decisionType')}</TableHead>
                  <TableHead>{t('meetings.decisions.votingResult')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisions.map((decision) => (
                  <TableRow key={decision.id}>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2">{decision.decision_text}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{decision.decision_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {decision.voting_result && (
                        <Badge variant="secondary">{decision.voting_result}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('meetings.decisions.noDecisions')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
