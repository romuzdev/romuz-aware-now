/**
 * Question Card Component
 * 
 * Displays a single assessment question with answer options
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Label } from '@/core/components/ui/label';
import { Badge } from '@/core/components/ui/badge';

interface QuestionOption {
  id: string;
  text: string;
}

interface QuestionCardProps {
  questionNumber: number;
  questionText: string;
  questionType: 'single_choice' | 'multiple_choice' | 'true_false';
  options: QuestionOption[];
  selectedAnswers?: string[];
  onAnswerChange: (answers: string[]) => void;
  isReview?: boolean;
  correctAnswers?: string[];
  points?: number;
}

export function QuestionCard({
  questionNumber,
  questionText,
  questionType,
  options,
  selectedAnswers = [],
  onAnswerChange,
  isReview = false,
  correctAnswers = [],
  points,
}: QuestionCardProps) {
  const handleSingleChoiceChange = (value: string) => {
    onAnswerChange([value]);
  };

  const handleMultipleChoiceChange = (optionId: string, checked: boolean) => {
    if (checked) {
      onAnswerChange([...selectedAnswers, optionId]);
    } else {
      onAnswerChange(selectedAnswers.filter(id => id !== optionId));
    }
  };

  const isCorrect = (optionId: string) => {
    return correctAnswers.includes(optionId);
  };

  const isWrong = (optionId: string) => {
    return selectedAnswers.includes(optionId) && !correctAnswers.includes(optionId);
  };

  return (
    <Card className={isReview ? 'border-l-4 border-l-primary' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            <Badge variant="outline" className="mr-2">
              Q{questionNumber}
            </Badge>
            {questionText}
          </CardTitle>
          {points && (
            <Badge variant="secondary">{points} pts</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {questionType === 'single_choice' || questionType === 'true_false' ? (
          <RadioGroup
            value={selectedAnswers[0]}
            onValueChange={handleSingleChoiceChange}
            disabled={isReview}
          >
            {options.map((option) => (
              <div
                key={option.id}
                className={`flex items-center space-x-2 p-3 rounded-md ${
                  isReview
                    ? isCorrect(option.id)
                      ? 'bg-green-50 border border-green-200'
                      : isWrong(option.id)
                      ? 'bg-red-50 border border-red-200'
                      : ''
                    : 'hover:bg-accent'
                }`}
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
                {isReview && isCorrect(option.id) && (
                  <Badge variant="default">Correct</Badge>
                )}
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="space-y-2">
            {options.map((option) => (
              <div
                key={option.id}
                className={`flex items-center space-x-2 p-3 rounded-md ${
                  isReview
                    ? isCorrect(option.id)
                      ? 'bg-green-50 border border-green-200'
                      : isWrong(option.id)
                      ? 'bg-red-50 border border-red-200'
                      : ''
                    : 'hover:bg-accent'
                }`}
              >
                <Checkbox
                  id={option.id}
                  checked={selectedAnswers.includes(option.id)}
                  onCheckedChange={(checked) =>
                    handleMultipleChoiceChange(option.id, checked as boolean)
                  }
                  disabled={isReview}
                />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
                {isReview && isCorrect(option.id) && (
                  <Badge variant="default">Correct</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
