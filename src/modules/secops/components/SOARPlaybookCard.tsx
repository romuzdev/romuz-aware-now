/**
 * SOAR Playbook Card Component
 * M18.5 - SecOps Integration
 */

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Play, Pause, Edit, Trash2, TrendingUp } from 'lucide-react';
import type { SOARPlaybook } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SOARPlaybookCardProps {
  playbook: SOARPlaybook;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => void;
}

export function SOARPlaybookCard({
  playbook,
  onActivate,
  onDeactivate,
  onEdit,
  onDelete,
  onRun,
}: SOARPlaybookCardProps) {
  const successRate = playbook.execution_count > 0
    ? Math.round((playbook.success_count / playbook.execution_count) * 100)
    : 0;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{playbook.playbook_name_ar}</h3>
            {playbook.is_active ? (
              <Badge variant="default" className="bg-green-500">نشط</Badge>
            ) : (
              <Badge variant="secondary">غير نشط</Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {playbook.description_ar || 'لا يوجد وصف'}
          </p>
        </div>

        <div className="flex gap-1">
          {playbook.is_active ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeactivate?.(playbook.id)}
            >
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onActivate?.(playbook.id)}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(playbook.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(playbook.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-muted rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">التنفيذات</p>
          <p className="text-lg font-semibold">{playbook.execution_count}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">الناجحة</p>
          <p className="text-lg font-semibold text-green-600">{playbook.success_count}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">معدل النجاح</p>
          <div className="flex items-center gap-1">
            <p className="text-lg font-semibold">{successRate}%</p>
            <TrendingUp className="h-3 w-3 text-green-600" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>آخر تحديث: {format(new Date(playbook.updated_at), 'PPp', { locale: ar })}</span>
        
        {onRun && playbook.is_active && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRun(playbook.id)}
          >
            <Play className="h-3 w-3 mr-1" />
            تشغيل
          </Button>
        )}
      </div>
    </Card>
  );
}
