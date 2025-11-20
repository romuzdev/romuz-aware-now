/**
 * Course Report Card Component
 * 
 * Displays key metrics for a course report
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Progress } from '@/core/components/ui/progress';
import { Badge } from '@/core/components/ui/badge';
import { Users, TrendingUp, Clock, Award } from 'lucide-react';

interface CourseMetrics {
  totalEnrollments: number;
  completionRate: number;
  averageScore: number;
  averageTimeHours: number;
  activeStudents: number;
}

interface CourseReportCardProps {
  courseName: string;
  metrics: CourseMetrics;
  status?: 'draft' | 'published' | 'archived';
}

export function CourseReportCard({
  courseName,
  metrics,
  status = 'published',
}: CourseReportCardProps) {
  const getStatusBadge = () => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline',
    };

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{courseName}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Total Enrollments</span>
            </div>
            <div className="text-2xl font-bold">{metrics.totalEnrollments}</div>
            <div className="text-xs text-muted-foreground">
              {metrics.activeStudents} active
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Completion Rate</span>
            </div>
            <div className="text-2xl font-bold">{metrics.completionRate}%</div>
            <Progress value={metrics.completionRate} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>Average Score</span>
            </div>
            <div className="text-2xl font-bold">{metrics.averageScore}%</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Avg. Time</span>
            </div>
            <div className="text-2xl font-bold">{metrics.averageTimeHours}h</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
