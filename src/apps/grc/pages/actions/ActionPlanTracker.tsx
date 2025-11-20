/**
 * Action Plan Tracker Page
 * Gate-H: Enhanced action plan management with milestones, dependencies, and tracking
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { ArrowLeft, Activity, CheckSquare, GitBranch, Bell } from 'lucide-react';
import {
  useGateHActionById,
  useMilestones,
  useDependencies,
  useTrackingHistory,
  useActionHealthMetrics,
  useActionNotifications,
  useCompleteMilestone,
  useDeleteDependency,
} from '@/modules/actions';
import {
  MilestonesList,
  ActionHealthCard,
  ProgressTimeline,
  DependencyGraph,
  MilestoneGanttChart,
  ActionPlanAutomation,
} from '@/modules/actions/components';

export default function ActionPlanTracker() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: action, isLoading: actionLoading } = useGateHActionById(id || null);
  const { data: milestones, isLoading: milestonesLoading } = useMilestones(id || null);
  const { data: dependencies, isLoading: depsLoading } = useDependencies(id || null);
  const { data: tracking, isLoading: trackingLoading } = useTrackingHistory(id || null);
  const { data: healthMetrics, isLoading: healthLoading } = useActionHealthMetrics(id || null);
  const { data: notifications, isLoading: notifLoading } = useActionNotifications(id || null);

  // Mutations
  const { mutate: completeMilestone } = useCompleteMilestone();
  const { mutate: deleteDependency } = useDeleteDependency();

  if (!id) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">معرف الإجراء مفقود</p>
        <Button onClick={() => navigate('/grc/actions')} className="mt-4">
          العودة للقائمة
        </Button>
      </div>
    );
  }

  if (actionLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">الإجراء غير موجود</p>
        <Button onClick={() => navigate('/grc/actions')} className="mt-4">
          العودة للقائمة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/grc/actions')}
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          العودة
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{action.title_ar}</h1>
          {action.desc_ar && (
            <p className="text-muted-foreground mt-1">{action.desc_ar}</p>
          )}
        </div>
      </div>

      {/* Health Card */}
      {healthLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : healthMetrics ? (
        <ActionHealthCard metrics={healthMetrics} />
      ) : null}

      {/* Tabs */}
      <Tabs defaultValue="milestones" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="milestones" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            المعالم
          </TabsTrigger>
          <TabsTrigger value="gantt" className="gap-2">
            <Activity className="h-4 w-4" />
            الجدول الزمني
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="gap-2">
            <GitBranch className="h-4 w-4" />
            التبعيات
          </TabsTrigger>
          <TabsTrigger value="tracking" className="gap-2">
            <Activity className="h-4 w-4" />
            التتبع
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Bell className="h-4 w-4" />
            الأتمتة
          </TabsTrigger>
        </TabsList>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          {milestonesLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <MilestonesList
              milestones={milestones || []}
              onComplete={(milestoneId) =>
                completeMilestone({ milestoneId })
              }
              onAdd={() => {
                // TODO: Open milestone creation dialog
                console.log('Add milestone');
              }}
              onEdit={(milestone) => {
                // TODO: Open milestone edit dialog
                console.log('Edit milestone:', milestone);
              }}
            />
          )}
        </TabsContent>

        {/* Gantt Chart Tab */}
        <TabsContent value="gantt">
          {milestonesLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <MilestoneGanttChart milestones={milestones || []} />
          )}
        </TabsContent>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies">
          {depsLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <DependencyGraph
              dependencies={dependencies || []}
              currentActionId={id}
              onDelete={(depId) => deleteDependency(depId)}
              onAdd={() => {
                // TODO: Open dependency creation dialog
                console.log('Add dependency');
              }}
            />
          )}
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking">
          {trackingLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <ProgressTimeline snapshots={tracking || []} />
          )}
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation">
          <ActionPlanAutomation
            actionId={id}
            actionTitle={action.title_ar}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
