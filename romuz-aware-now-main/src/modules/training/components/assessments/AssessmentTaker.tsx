import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import { Progress } from '@/core/components/ui/progress';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Question } from '../../types';

interface AssessmentTakerProps {
  questions: Question[];
  timeLimit?: number;
  onSubmit: (answers: Record<string, any>) => void;
  isLoading?: boolean;
}

export function AssessmentTaker({ questions, timeLimit, onSubmit, isLoading }: AssessmentTakerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit ? timeLimit * 60 : null);

  const currentQuestion = questions[currentIndex];
  const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (!prev || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const isAnswered = currentQuestion.id in answers;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                السؤال {currentIndex + 1} من {questions.length}
              </p>
              <Progress value={progressPercentage} />
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="h-5 w-5" />
                <span className={timeRemaining < 300 ? 'text-destructive' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            تم الإجابة: {answeredCount} / {questions.length}
          </p>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion.question_text}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {currentQuestion.points} نقطة
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleAnswerChange}
            >
              {currentQuestion.options.map((option: any, index: number) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value={option.text} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {String.fromCharCode(65 + index)}. {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.question_type === 'true_false' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleAnswerChange}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="flex-1 cursor-pointer">صح</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="flex-1 cursor-pointer">خطأ</Label>
              </div>
            </RadioGroup>
          )}

          {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay') && (
            <Textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              rows={currentQuestion.question_type === 'essay' ? 8 : 3}
              placeholder="اكتب إجابتك هنا..."
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronRight className="ml-2 h-4 w-4" />
          السابق
        </Button>

        <div className="flex gap-1">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-8 h-8 rounded text-sm ${
                index === currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : index in Object.keys(answers).map((k) => questions.findIndex((q) => q.id === k))
                  ? 'bg-success text-success-foreground'
                  : 'bg-muted'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentIndex < questions.length - 1 ? (
          <Button onClick={handleNext}>
            التالي
            <ChevronLeft className="mr-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'جاري التسليم...' : 'تسليم الاختبار'}
          </Button>
        )}
      </div>
    </div>
  );
}
