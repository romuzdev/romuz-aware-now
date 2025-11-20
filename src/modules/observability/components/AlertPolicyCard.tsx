/**
 * Alert Policy Card Component
 * Gate-E: Observability Module
 */

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface AlertPolicy {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold_value: number;
  severity: string;
  is_enabled: boolean;
  created_at: string;
}

interface AlertPolicyCardProps {
  policy: AlertPolicy;
  onClick?: () => void;
}

export function AlertPolicyCard({ policy, onClick }: AlertPolicyCardProps) {
  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-accent transition-colors" 
      onClick={onClick}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {policy.is_enabled ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            )}
            <h3 className="font-semibold text-foreground">{policy.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {policy.metric} {policy.operator} {policy.threshold_value}
          </p>
        </div>
        <Badge variant={getSeverityVariant(policy.severity)}>
          {getSeverityLabel(policy.severity)}
        </Badge>
      </div>
    </Card>
  );
}

function getSeverityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    low: 'secondary',
    medium: 'outline',
    high: 'default',
    critical: 'destructive',
  };
  return variants[severity] || 'default';
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    low: 'منخفض',
    medium: 'متوسط',
    high: 'عالي',
    critical: 'حرج',
  };
  return labels[severity] || severity;
}
