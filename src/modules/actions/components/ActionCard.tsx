/**
 * Action Card Component
 * Gate-H: Actions Module
 */

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import type { GateHActionItem } from '../types';

interface ActionCardProps {
  action: GateHActionItem;
  onClick?: () => void;
}

export function ActionCard({ action, onClick }: ActionCardProps) {
  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-accent transition-colors" 
      onClick={onClick}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{action.title_ar}</h3>
          {action.desc_ar && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {action.desc_ar}
            </p>
          )}
        </div>
        <Badge variant={getStatusVariant(action.status)}>
          {getStatusLabel(action.status)}
        </Badge>
      </div>
      
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        {action.assignee_display_name && (
          <span>المكلف: {action.assignee_display_name}</span>
        )}
        {action.due_date && (
          <span>الموعد: {new Date(action.due_date).toLocaleDateString('ar-SA')}</span>
        )}
        {action.priority && (
          <Badge variant="outline" className="text-xs">
            {getPriorityLabel(action.priority)}
          </Badge>
        )}
      </div>
    </Card>
  );
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    new: 'secondary',
    in_progress: 'default',
    blocked: 'destructive',
    verify: 'outline',
    closed: 'secondary',
  };
  return variants[status] || 'default';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'جديد',
    in_progress: 'قيد التنفيذ',
    blocked: 'محظور',
    verify: 'للمراجعة',
    closed: 'مغلق',
  };
  return labels[status] || status;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    critical: 'حرج',
    high: 'عالي',
    medium: 'متوسط',
    low: 'منخفض',
  };
  return labels[priority] || priority;
}
