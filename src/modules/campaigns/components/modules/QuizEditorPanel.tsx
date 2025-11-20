import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { useQuizEditor } from '@/modules/campaigns/hooks/quizzes/useQuizEditor';
import { Plus, Trash, Edit2, Save, X, CheckCircle, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { QuizFormData, QuestionFormData, OptionFormData } from '@/modules/campaigns';
import { format } from 'date-fns';

interface Props {
  moduleId: string;
  onTestRun?: () => void;
}

export function QuizEditorPanel({ moduleId, onTestRun }: Props) {
  const { toast } = useToast();
  const { quiz, loading, canManage, upsertQuiz, createQuestion, updateQuestion, deleteQuestion, createOption, updateOption, deleteOption, isLoading } = useQuizEditor(moduleId);

  const [passScore, setPassScore] = useState(quiz?.passScore || 70);
  const [timeLimitSecs, setTimeLimitSecs] = useState<number | null>(quiz?.timeLimitSecs || null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [optionText, setOptionText] = useState('');

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Permission denied: Managers only</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  async function handleSaveQuiz() {
    try {
      await upsertQuiz({ passScore, timeLimitSecs });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    }
  }

  async function handleAddQuestion() {
    if (!quiz) {
      toast({ variant: 'destructive', title: 'Create quiz settings first' });
      return;
    }
    const order = (quiz.questions?.length || 0) + 1;
    try {
      await createQuestion({ quizId: quiz.id, formData: { text: 'New question', order } });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    }
  }

  async function handleUpdateQuestion(id: string) {
    try {
      await updateQuestion({ id, formData: { text: questionText } });
      setEditingQuestion(null);
      setQuestionText('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestion(id);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    }
  }

  async function handleAddOption(questionId: string) {
    try {
      await createOption({ questionId, formData: { text: 'New option', isCorrect: false } });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    }
  }

  async function handleUpdateOption(id: string, isCorrect?: boolean) {
    try {
      const patch: Partial<OptionFormData> = {};
      if (optionText) patch.text = optionText;
      if (isCorrect !== undefined) patch.isCorrect = isCorrect;
      await updateOption({ id, formData: patch });
      setEditingOption(null);
      setOptionText('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    }
  }

  async function handleDeleteOption(id: string) {
    if (!confirm('Delete this option?')) return;
    try {
      await deleteOption(id);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Quiz</CardTitle>
            {quiz && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {format(new Date(quiz.updatedAt), 'MMM d, yyyy HH:mm')}
              </p>
            )}
          </div>
          {onTestRun && quiz && quiz.questions && quiz.questions.length > 0 && (
            <Button size="sm" variant="outline" onClick={onTestRun}>
              <PlayCircle className="w-4 h-4 mr-1" />
              Test Run
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quiz Settings */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="passScore" className="text-xs">
                Pass Score (%)
              </Label>
              <Input
                id="passScore"
                type="number"
                min="0"
                max="100"
                value={passScore}
                onChange={(e) => setPassScore(parseFloat(e.target.value))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="timeLimit" className="text-xs">
                Time Limit (seconds)
              </Label>
              <Input
                id="timeLimit"
                type="number"
                min="0"
                placeholder="Optional"
                value={timeLimitSecs || ''}
                onChange={(e) => setTimeLimitSecs(e.target.value ? parseInt(e.target.value) : null)}
                disabled={isLoading}
              />
            </div>
          </div>
          <Button size="sm" onClick={handleSaveQuiz} disabled={isLoading}>
            <Save className="w-4 h-4 mr-1" />
            Save Quiz Settings
          </Button>
        </div>

        <Separator />

        {/* Questions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Questions</h4>
            <Button size="sm" variant="outline" onClick={handleAddQuestion} disabled={isLoading || !quiz}>
              <Plus className="w-4 h-4 mr-1" />
              Add Question
            </Button>
          </div>

          {quiz?.questions && quiz.questions.length > 0 ? (
            <div className="space-y-3">
              {quiz.questions.map((question, qIndex) => (
                <Card key={question.id} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {editingQuestion === question.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={questionText}
                              onChange={(e) => setQuestionText(e.target.value)}
                              placeholder="Question text"
                              className="text-sm"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateQuestion(question.id)}
                              disabled={isLoading}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingQuestion(null);
                                setQuestionText('');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Q{qIndex + 1}
                            </Badge>
                            <span className="text-sm font-medium">{question.text}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {editingQuestion !== question.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingQuestion(question.id);
                              setQuestionText(question.text);
                            }}
                            disabled={isLoading}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteQuestion(question.id)}
                          disabled={isLoading}
                        >
                          <Trash className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Options */}
                    {question.options && question.options.length > 0 && (
                      <div className="space-y-1">
                        {question.options.map((option) => (
                          <div key={option.id} className="flex items-center gap-2 p-2 border rounded">
                            {editingOption === option.id ? (
                              <>
                                <Input
                                  value={optionText}
                                  onChange={(e) => setOptionText(e.target.value)}
                                  placeholder="Option text"
                                  className="flex-1 text-sm"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateOption(option.id)}
                                  disabled={isLoading}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingOption(null);
                                    setOptionText('');
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant={option.isCorrect ? 'default' : 'outline'}
                                  onClick={() => handleUpdateOption(option.id, !option.isCorrect)}
                                  disabled={isLoading}
                                  className="p-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <span className="flex-1 text-sm">{option.text}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingOption(option.id);
                                    setOptionText(option.text);
                                  }}
                                  disabled={isLoading}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteOption(option.id)}
                                  disabled={isLoading}
                                >
                                  <Trash className="w-3 h-3 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddOption(question.id)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No questions yet. Click "Add Question" to start.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
