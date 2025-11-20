/**
 * Student Dashboard Stats Component
 * 
 * Displays key statistics for student dashboard
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { BookOpen, Award, Clock, TrendingUp } from 'lucide-react';

interface DashboardStat {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

interface StudentDashboardStatsProps {
  enrolledCourses: number;
  completedCourses: number;
  totalLearningHours: number;
  certificatesEarned: number;
}

export function StudentDashboardStats({
  enrolledCourses,
  completedCourses,
  totalLearningHours,
  certificatesEarned,
}: StudentDashboardStatsProps) {
  const stats: DashboardStat[] = [
    {
      title: 'Enrolled Courses',
      value: enrolledCourses,
      icon: <BookOpen className="h-5 w-5" />,
      description: 'Active enrollments',
    },
    {
      title: 'Completed',
      value: completedCourses,
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Courses finished',
    },
    {
      title: 'Learning Hours',
      value: totalLearningHours,
      icon: <Clock className="h-5 w-5" />,
      description: 'Total time spent',
    },
    {
      title: 'Certificates',
      value: certificatesEarned,
      icon: <Award className="h-5 w-5" />,
      description: 'Earned certificates',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className="text-muted-foreground">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
