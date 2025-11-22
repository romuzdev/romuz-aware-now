/**
 * M25 - Active Playbooks Panel Component
 */

import React from 'react';
import { Loader2, PlayCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Progress } from '@/core/components/ui/progress';
import { Badge } from '@/core/components/ui/badge';
import { useActivePlaybooks } from '../hooks';

export function ActivePlaybooksPanel() {
  const { playbooks, isLoading } = useActivePlaybooks();

  const getPriorityVariant = (priority: string) => {
    const map = {
      critical: 'destructive' as const,
      high: 'default' as const,
      medium: 'secondary' as const,
      low: 'outline' as const,
    };
    return map[priority as keyof typeof map] || 'secondary';
  };

  const getPriorityLabel = (priority: string) => {
    const map = {
      critical: 'حرجة',
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
    };
    return map[priority as keyof typeof map] || priority;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5" />
          خطط التحسين النشطة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : playbooks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            لا توجد خطط تحسين نشطة حالياً
          </div>
        ) : (
          <div className="space-y-4">
            {playbooks.slice(0, 3).map((playbook) => (
              <div
                key={playbook.id}
                className="p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{playbook.title_ar}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {playbook.description_ar}
                    </p>
                  </div>
                  <Badge variant={getPriorityVariant(playbook.priority)}>
                    {getPriorityLabel(playbook.priority)}
                  </Badge>
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">التقدم</span>
                    <span className="font-medium">{playbook.progress_pct}%</span>
                  </div>
                  <Progress value={playbook.progress_pct} className="h-2" />

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>
                        {playbook.completed_actions} / {playbook.total_actions} مهمة
                      </span>
                    </div>
                    {playbook.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(playbook.due_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
