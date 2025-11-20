import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Label } from '@/core/components/ui/label';
import { Card, CardContent } from '@/core/components/ui/card';
import { useQuizRuntime } from '@/modules/campaigns/hooks/quizzes/useQuizRuntime';
import { CheckCircle, XCircle, Timer } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  moduleId: string;
  participantId: string;
  campaignId: string;
  isTestRun?: boolean;
}

export function QuizTakeDialog({ open, onClose, moduleId, participantId, campaignId, isTestRun }: Props) {
  const { quiz, latestSubmission, loading, submitQuiz, isSubmitting } = useQuizRuntime(moduleId, participantId, campaignId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (quiz?.timeLimitSecs && open && !latestSubmission?.passed) {
      setTimeLeft(quiz.timeLimitSecs);
    }
  }, [quiz, open, latestSubmission]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && quiz && !isSubmitting) {
      handleSubmit();
    }
  }, [timeLeft]);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading Quiz...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (!quiz) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Quiz</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This module does not have a quiz.</p>
        </DialogContent>
      </Dialog>
    );
  }

  const hasPassed = latestSubmission?.passed;

  async function handleSubmit() {
    try {
      await submitQuiz({ answers });
      setAnswers({});
    } catch (error) {
      console.error('Submit failed:', error);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isTestRun ? 'Quiz Test Run' : hasPassed ? 'Quiz Completed' : 'Take Quiz'}
            </DialogTitle>
            {timeLeft !== null && timeLeft > 0 && !hasPassed && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {formatTime(timeLeft)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Pass Score: {quiz.passScore}%</span>
            {quiz.timeLimitSecs && <span>• Time Limit: {Math.floor(quiz.timeLimitSecs / 60)} min</span>}
          </div>
        </DialogHeader>

        {hasPassed ? (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-success" />
                <div>
                  <p className="font-medium text-success-foreground">Quiz Passed!</p>
                  <p className="text-sm text-success/90">
                    Score: {latestSubmission.score.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : latestSubmission && !latestSubmission.passed ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-destructive" />
                <div>
                  <p className="font-medium text-destructive-foreground">Quiz Not Passed</p>
                  <p className="text-sm text-destructive/90">
                    Score: {latestSubmission.score.toFixed(0)}% (Required: {quiz.passScore}%)
                  </p>
                  <p className="text-xs text-destructive/80 mt-1">You can retake the quiz.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {(!hasPassed || isTestRun) && (
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">
                      {index + 1}
                    </Badge>
                    <p className="text-sm font-medium flex-1">{question.text}</p>
                  </div>

                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) =>
                      setAnswers((prev) => ({ ...prev, [question.id]: value }))
                    }
                  >
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="text-sm cursor-pointer">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {hasPassed ? 'Close' : 'Cancel'}
          </Button>
          {!hasPassed && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(answers).length !== quiz.questions.length}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
