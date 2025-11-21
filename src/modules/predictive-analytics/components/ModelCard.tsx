/**
 * M19 Part 2: Model Card Component
 * Displays ML model information and performance metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import { Brain, Play, Settings, TrendingUp, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ModelCardProps {
  model: {
    id: string;
    model_name?: string;
    model_type: string;
    accuracy_score?: number;
    last_trained_at?: string;
    is_active: boolean;
    training_status?: string;
  };
  onRun?: (modelId: string) => void;
  onConfigure?: (modelId: string) => void;
}

export function ModelCard({ model, onRun, onConfigure }: ModelCardProps) {
  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      trained: { label: 'مدرّب', variant: 'default' as any },
      training: { label: 'قيد التدريب', variant: 'secondary' as any },
      failed: { label: 'فشل', variant: 'destructive' as any },
      pending: { label: 'في الانتظار', variant: 'outline' as any },
    };

    const config = statusMap[status || 'pending'] || { label: 'غير معروف', variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryIcon = () => {
    const modelType = model.model_type?.toLowerCase() || '';
    if (modelType.includes('risk')) return <AlertCircle className="h-4 w-4" />;
    if (modelType.includes('incident')) return <TrendingUp className="h-4 w-4" />;
    return <Brain className="h-4 w-4" />;
  };

  return (
    <Card className={model.is_active ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getCategoryIcon()}
            <div>
              <CardTitle className="text-lg">{model.model_name || 'نموذج تنبؤ'}</CardTitle>
              <CardDescription>{model.model_type}</CardDescription>
            </div>
          </div>
          {getStatusBadge(model.training_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Accuracy Score */}
        {model.accuracy_score !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">دقة النموذج</span>
              <span className="font-medium">{(model.accuracy_score * 100).toFixed(1)}%</span>
            </div>
            <Progress value={model.accuracy_score * 100} className="h-2" />
          </div>
        )}

        {/* Last Trained */}
        {model.last_trained_at && (
          <div className="text-sm text-muted-foreground">
            آخر تدريب: {formatDistanceToNow(new Date(model.last_trained_at), {
              addSuffix: true,
              locale: ar,
            })}
          </div>
        )}

        {/* Model Type */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{model.model_type}</Badge>
          {model.is_active && (
            <Badge variant="secondary">نشط</Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onRun?.(model.id)}
            className="flex-1"
            size="sm"
            disabled={!model.is_active || model.training_status !== 'trained'}
          >
            <Play className="h-4 w-4 ml-2" />
            تنفيذ
          </Button>
          <Button
            onClick={() => onConfigure?.(model.id)}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
