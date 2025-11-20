/**
 * Dependency Graph Component
 * Displays action dependencies as a visual graph
 */

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import type { ActionDependency } from '../types/dependencies.types';

interface DependencyGraphProps {
  dependencies: ActionDependency[];
  currentActionId: string;
  onAdd?: () => void;
  onDelete?: (dependencyId: string) => void;
  readOnly?: boolean;
}

export function DependencyGraph({
  dependencies,
  currentActionId,
  onAdd,
  onDelete,
  readOnly = false,
}: DependencyGraphProps) {
  const getDependencyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      finish_to_start: 'إنهاء → بداية',
      start_to_start: 'بداية → بداية',
      finish_to_finish: 'إنهاء → إنهاء',
      start_to_finish: 'بداية → إنهاء',
    };
    return labels[type] || type;
  };

  const getViolationBadge = (status: string | null) => {
    if (!status) return null;

    const variants: Record<string, { label: string; variant: any }> = {
      ok: { label: 'صحيح', variant: 'default' },
      warning: { label: 'تحذير', variant: 'outline' },
      violation: { label: 'انتهاك', variant: 'destructive' },
    };

    const config = variants[status];
    if (!config) return null;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Split dependencies into upstream (sources) and downstream (targets)
  const upstreamDeps = dependencies.filter(
    (dep) => dep.target_action_id === currentActionId
  );
  const downstreamDeps = dependencies.filter(
    (dep) => dep.source_action_id === currentActionId
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          التبعيات ({dependencies.length})
        </h3>
        {!readOnly && onAdd && (
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 ml-2" />
            إضافة تبعية
          </Button>
        )}
      </div>

      {dependencies.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">لا توجد تبعيات محددة</p>
          {!readOnly && onAdd && (
            <Button onClick={onAdd} variant="outline" className="mt-4">
              إضافة أول تبعية
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upstream Dependencies */}
          {upstreamDeps.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                التبعيات الأمامية ({upstreamDeps.length})
              </h4>
              <div className="space-y-2">
                {upstreamDeps.map((dep) => (
                  <Card key={dep.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {dep.source_action_title}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            الإجراء الحالي
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {getDependencyTypeLabel(dep.dependency_type)}
                          </Badge>
                          {dep.lag_days > 0 && (
                            <Badge variant="secondary">
                              تأخير: {dep.lag_days} يوم
                            </Badge>
                          )}
                          {getViolationBadge(dep.violation_status)}
                          {!dep.is_active && (
                            <Badge variant="outline">غير نشط</Badge>
                          )}
                        </div>
                        {dep.notes_ar && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {dep.notes_ar}
                          </p>
                        )}
                      </div>
                      {!readOnly && onDelete && (
                        <Button
                          onClick={() => onDelete(dep.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Downstream Dependencies */}
          {downstreamDeps.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                التبعيات الخلفية ({downstreamDeps.length})
              </h4>
              <div className="space-y-2">
                {downstreamDeps.map((dep) => (
                  <Card key={dep.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            الإجراء الحالي
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {dep.target_action_title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {getDependencyTypeLabel(dep.dependency_type)}
                          </Badge>
                          {dep.lag_days > 0 && (
                            <Badge variant="secondary">
                              تأخير: {dep.lag_days} يوم
                            </Badge>
                          )}
                          {getViolationBadge(dep.violation_status)}
                          {!dep.is_active && (
                            <Badge variant="outline">غير نشط</Badge>
                          )}
                        </div>
                        {dep.notes_ar && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {dep.notes_ar}
                          </p>
                        )}
                      </div>
                      {!readOnly && onDelete && (
                        <Button
                          onClick={() => onDelete(dep.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
