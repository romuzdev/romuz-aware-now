/**
 * Assessment Timer Component
 * 
 * Displays countdown timer for timed assessments
 */

import { useEffect, useState } from 'react';
import { Card } from '@/core/components/ui/card';
import { Clock, AlertTriangle } from 'lucide-react';

interface AssessmentTimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

export function AssessmentTimer({
  durationMinutes,
  onTimeUp,
  isPaused = false,
}: AssessmentTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, secondsLeft, onTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isLowTime = secondsLeft < 300; // Less than 5 minutes

  return (
    <Card className={`p-4 ${isLowTime ? 'border-red-500 bg-red-50' : ''}`}>
      <div className="flex items-center gap-3">
        {isLowTime ? (
          <AlertTriangle className="h-5 w-5 text-red-500" />
        ) : (
          <Clock className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <div className="text-sm text-muted-foreground">Time Remaining</div>
          <div className={`text-2xl font-bold ${isLowTime ? 'text-red-500' : ''}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>
    </Card>
  );
}
