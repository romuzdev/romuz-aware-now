/**
 * M19 Part 2: Confidence Indicator Component
 * Visual indicator for prediction confidence levels
 */

import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfidenceIndicatorProps {
  confidence: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceIndicator({ 
  confidence, 
  showProgress = false,
  size = 'md' 
}: ConfidenceIndicatorProps) {
  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.8) return { label: 'عالي', variant: 'default' as any, icon: CheckCircle, color: 'text-green-600' };
    if (conf >= 0.6) return { label: 'متوسط', variant: 'secondary' as any, icon: Info, color: 'text-blue-600' };
    return { label: 'منخفض', variant: 'destructive' as any, icon: AlertTriangle, color: 'text-yellow-600' };
  };

  const level = getConfidenceLevel(confidence);
  const Icon = level.icon;
  const percentage = (confidence * 100).toFixed(0);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${level.color}`} />
        <Badge variant={level.variant} className={sizeClasses[size]}>
          {level.label} ({percentage}%)
        </Badge>
      </div>
      
      {showProgress && (
        <Progress value={confidence * 100} className="h-2" />
      )}
    </div>
  );
}
