import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { useCan } from '@/core/rbac';
import { useModules } from '@/modules/campaigns/hooks/modules/useModules';
import { useModuleProgress } from '@/modules/campaigns/hooks/modules/useModuleProgress';
import { useQuizRuntime } from '@/modules/campaigns/hooks/quizzes/useQuizRuntime';
import { QuizTakeDialog } from '@/modules/campaigns/components/modules/QuizTakeDialog';
import { Check, Circle, Clock, AlertCircle } from 'lucide-react';
import type { Module } from '@/modules/campaigns';

export default function LearnerPreviewPage() {
  const { id: campaignId = '', participantId = '' } = useParams();
  const can = useCan();
  const [quizModuleId, setQuizModuleId] = useState<string | null>(null);

  if (!can('campaigns.manage')) {
    return <div className="p-4 text-destructive">Access denied: Admin only</div>;
  }

  const { modules, loading: modulesLoading } = useModules(campaignId);
  const { progress, markStarted, markCompleted, isLoading } = useModuleProgress(
    campaignId,
    participantId
  );

  function getModuleStatus(moduleId: string): 'not_started' | 'in_progress' | 'completed' {
    const p = progress.find((pr) => pr.moduleId === moduleId);
    return p?.status || 'not_started';
  }

  async function handleMarkCompleted(module: Module) {
    const status = getModuleStatus(module.id);
    if (status === 'not_started') {
      await markStarted(module.id);
    }
    await markCompleted(module.id);
  }

  function handleTakeQuiz(moduleId: string) {
    setQuizModuleId(moduleId);
  }

  if (modulesLoading) {
    return <div className="p-4 text-muted-foreground">Loading modules...</div>;
  }

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Learner Preview (Internal QA)</h1>
          <p className="text-sm text-muted-foreground">Campaign: {campaignId}</p>
          <p className="text-sm text-muted-foreground">Participant: {participantId}</p>
        </div>
      </div>

      <div className="space-y-3">
        {modules.length === 0 && (
          <p className="text-sm text-muted-foreground">No modules in this campaign</p>
        )}

        {modules.map((module) => {
          const status = getModuleStatus(module.id);
          return (
            <ModuleCard
              key={module.id}
              module={module}
              status={status}
              campaignId={campaignId}
              participantId={participantId}
              onMarkCompleted={handleMarkCompleted}
              onTakeQuiz={handleTakeQuiz}
              isLoading={isLoading}
            />
          );
        })}
      </div>

      <QuizTakeDialog
        open={!!quizModuleId}
        onClose={() => setQuizModuleId(null)}
        moduleId={quizModuleId || ''}
        participantId={participantId}
        campaignId={campaignId}
      />
    </div>
  );
}

interface ModuleCardProps {
  module: Module;
  status: 'not_started' | 'in_progress' | 'completed';
  campaignId: string;
  participantId: string;
  onMarkCompleted: (module: Module) => void;
  onTakeQuiz: (moduleId: string) => void;
  isLoading: boolean;
}

function ModuleCard({ module, status, campaignId, participantId, onMarkCompleted, onTakeQuiz, isLoading }: ModuleCardProps) {
  const { quiz, latestSubmission } = useQuizRuntime(module.id, participantId, campaignId);
  const hasQuiz = !!quiz;
  const hasPassed = latestSubmission?.passed || false;
  const canComplete = !hasQuiz || hasPassed;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{module.title}</CardTitle>
            {module.isRequired && (
              <Badge variant="outline" className="text-xs">
                Required
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">{module.type}</Badge>
            {module.estimatedMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {module.estimatedMinutes} min
              </span>
            )}
            {hasQuiz && (
              <Badge variant="outline" className="text-xs">
                Has Quiz
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'not_started' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Circle className="w-3 h-3" />
              Not Started
            </Badge>
          )}
          {status === 'in_progress' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              In Progress
            </Badge>
          )}
          {status === 'completed' && (
            <Badge className="flex items-center gap-1 bg-success text-success-foreground">
              <Check className="w-3 h-3" />
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {module.type === 'article' && 'Read article content'}
          {module.type === 'video' && module.urlOrRef && (
            <a
              href={module.urlOrRef}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Watch video
            </a>
          )}
          {module.type === 'link' && module.urlOrRef && (
            <a
              href={module.urlOrRef}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Visit link
            </a>
          )}
          {module.type === 'file' && module.urlOrRef && (
            <a
              href={module.urlOrRef}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Download file
            </a>
          )}
        </div>

        {hasQuiz && (
          <div className="flex items-center gap-2 p-3 border rounded bg-muted/50">
            {hasPassed ? (
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                <span className="text-success font-medium">
                  Quiz Passed ({latestSubmission?.score.toFixed(0)}%)
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-muted-foreground">Quiz required to complete</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => onTakeQuiz(module.id)}>
                  {latestSubmission ? 'Retake Quiz' : 'Take Quiz'}
                </Button>
              </div>
            )}
          </div>
        )}

        {status !== 'completed' && (
          <div className="flex items-center justify-end gap-2">
            {!canComplete && (
              <span className="text-xs text-muted-foreground">Complete quiz first</span>
            )}
            <Button
              size="sm"
              onClick={() => onMarkCompleted(module)}
              disabled={isLoading || !canComplete}
            >
              Mark as Completed
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
