/**
 * Progress Card Component
 * 
 * Displays student progress for a course
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Progress } from '@/core/components/ui/progress';
import { Badge } from '@/core/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface ProgressCardProps {
  courseName: string;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export function ProgressCard({
  courseName,
  completedLessons,
  totalLessons,
  lastAccessedAt,
  status,
}: ProgressCardProps) {
  const progressPercent = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{courseName}</CardTitle>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{completedLessons} of {totalLessons} lessons completed</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          {getStatusBadge()}
          {lastAccessedAt && (
            <span className="text-xs text-muted-foreground">
              Last accessed: {new Date(lastAccessedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
