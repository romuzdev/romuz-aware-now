import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { fetchCommitteeMembers } from '@/modules/committees/integration';
import { useCan } from '@/core/rbac';
import { format } from 'date-fns';
import AddMemberDialog from '@/modules/committees/components/AddMemberDialog';

interface MembersTabProps {
  committeeId: string;
}

export default function CommitteeMembersTab({ committeeId }: MembersTabProps) {
  const { t } = useTranslation();
  const can = useCan();

  const { data: members, isLoading } = useQuery({
    queryKey: ['committee-members', committeeId],
    queryFn: () => fetchCommitteeMembers(committeeId),
    staleTime: 90 * 1000, // 90 seconds
    gcTime: 5 * 60 * 1000,
  });

  const canWrite = can('committee.write');

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
          <CardTitle>{t('committees.members.title')}</CardTitle>
          {canWrite && <AddMemberDialog committeeId={committeeId} />}
        </div>
      </CardHeader>
      <CardContent>
        {members && members.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('committees.members.user')}</TableHead>
                  <TableHead>{t('committees.members.role')}</TableHead>
                  <TableHead>{t('committees.members.hasVotingRight')}</TableHead>
                  <TableHead>{t('committees.members.startDate')}</TableHead>
                  <TableHead>{t('committees.members.endDate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.user_id}</TableCell>
                    <TableCell>{member.role || '-'}</TableCell>
                    <TableCell>
                      {member.is_voting ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      {member.start_at
                        ? format(new Date(member.start_at), 'yyyy-MM-dd')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {member.end_at
                        ? format(new Date(member.end_at), 'yyyy-MM-dd')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('committees.members.noMembers')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
