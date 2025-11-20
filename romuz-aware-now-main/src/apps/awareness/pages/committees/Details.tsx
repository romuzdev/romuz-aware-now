import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Calendar, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { fetchCommitteeById, deleteCommittee } from '@/modules/committees/integration';
import { useCan } from '@/core/rbac';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useState } from 'react';
import CommitteeMembersTab from './tabs/MembersTab';
import CommitteeMeetingsTab from './tabs/MeetingsTab';
import CommitteeTimelineTab from './tabs/TimelineTab';
import { CommitteeWorkflowPanel } from '@/apps/awareness/components/committees/CommitteeWorkflowPanel';
import { CommitteeNotificationsPanel } from '@/apps/awareness/components/committees/CommitteeNotificationsPanel';
import { CommitteeAnalyticsDashboard } from '@/apps/awareness/components/committees/CommitteeAnalyticsDashboard';

export default function CommitteeDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const can = useCan();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: committee, isLoading, error } = useQuery({
    queryKey: ['committee', id],
    queryFn: () => fetchCommitteeById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCommittee(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committees'] });
      toast({
        title: t('committees.success.deleted'),
      });
      navigate('/awareness/committees');
    },
    onError: (error) => {
      toast({
        title: t('committees.error.delete'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const canWrite = can('committee.write');
  const canManage = can('committee.manage');

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'dissolved':
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

  if (error || !committee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">{t('committees.error.fetch')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/awareness/committees')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{committee.name}</h1>
          {committee.name_ar && (
            <p className="text-muted-foreground">{committee.name_ar}</p>
          )}
        </div>
        {canWrite && (
          <Button variant="outline" onClick={() => navigate(`/awareness/committees/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            {t('committees.actions.edit')}
          </Button>
        )}
        {canManage && (
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t('committees.actions.delete')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('committees.committeeDetails')}</CardTitle>
          <CardDescription>
            {t('committees.code')}: {committee.code}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(committee.status)}>
                {t(`committees.status.${committee.status}`)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {committee.member_count || 0} {t('committees.membersCount')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {t('committees.updatedAt')}: {format(new Date(committee.updated_at), 'yyyy-MM-dd')}
              </span>
            </div>
          </div>
          {committee.description && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{committee.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="members">{t('committees.tabs.members')}</TabsTrigger>
          <TabsTrigger value="meetings">{t('committees.tabs.meetings')}</TabsTrigger>
          <TabsTrigger value="timeline">{t('committees.tabs.timeline')}</TabsTrigger>
          <TabsTrigger value="workflows">سير العمل</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <CommitteeMembersTab committeeId={id!} />
        </TabsContent>

        <TabsContent value="meetings">
          <CommitteeMeetingsTab committeeId={id!} />
        </TabsContent>

        <TabsContent value="timeline">
          <CommitteeTimelineTab committeeId={id!} />
        </TabsContent>

        <TabsContent value="workflows">
          <CommitteeWorkflowPanel committeeId={id!} />
        </TabsContent>

        <TabsContent value="notifications">
          <CommitteeNotificationsPanel />
        </TabsContent>

        <TabsContent value="analytics">
          <CommitteeAnalyticsDashboard committeeId={id!} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('committees.deleteCommittee')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this committee? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
