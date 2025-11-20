// Gate-J Part 4.4: Weight Comparison Table
// Compare current vs suggested weights

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import type { WeightSuggestion } from '@/modules/awareness';

interface WeightComparisonTableProps {
  suggestion: WeightSuggestion;
}

const WEIGHT_LABELS: Record<string, string> = {
  engagement: 'Engagement',
  completion: 'Completion',
  feedbackQuality: 'Feedback Quality',
  complianceLinkage: 'Compliance Linkage',
};

export function WeightComparisonTable({ suggestion }: WeightComparisonTableProps) {
  const { data: currentWeights, isLoading } = useQuery({
    queryKey: ['current-weights', suggestion.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('awareness_impact_weights')
        .select('*')
        .eq('tenant_id', suggestion.tenantId)
        .eq('version', suggestion.sourceWeightVersion)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!currentWeights) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Current weights not found
      </div>
    );
  }

  const weights = [
    {
      dimension: 'engagement',
      label: WEIGHT_LABELS.engagement,
      current: currentWeights.engagement_weight,
      suggested: suggestion.suggestedEngagementWeight,
    },
    {
      dimension: 'completion',
      label: WEIGHT_LABELS.completion,
      current: currentWeights.completion_weight,
      suggested: suggestion.suggestedCompletionWeight,
    },
    {
      dimension: 'feedbackQuality',
      label: WEIGHT_LABELS.feedbackQuality,
      current: currentWeights.feedback_quality_weight,
      suggested: suggestion.suggestedFeedbackQualityWeight,
    },
    {
      dimension: 'complianceLinkage',
      label: WEIGHT_LABELS.complianceLinkage,
      current: currentWeights.compliance_linkage_weight,
      suggested: suggestion.suggestedComplianceLinkageWeight,
    },
  ];

  const getTrendIcon = (change: number) => {
    if (Math.abs(change) < 0.01) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeBadge = (change: number) => {
    if (Math.abs(change) < 0.01) {
      return (
        <Badge variant="secondary">
          No Change
        </Badge>
      );
    }
    
    return (
      <Badge variant={change > 0 ? 'default' : 'destructive'}>
        {change > 0 ? '+' : ''}{(change * 100).toFixed(1)}%
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dimension</TableHead>
            <TableHead>Current Weight</TableHead>
            <TableHead>Suggested Weight</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {weights.map((weight) => {
            const change = (weight.suggested || 0) - (weight.current || 0);
            
            return (
              <TableRow key={weight.dimension}>
                <TableCell className="font-medium">
                  {weight.label}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">
                    {((weight.current || 0) * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm font-semibold">
                    {((weight.suggested || 0) * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  {getChangeBadge(change)}
                </TableCell>
                <TableCell>
                  {getTrendIcon(change)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Summary */}
      <div className="p-4 bg-muted/20 border-t">
        <div className="text-sm text-muted-foreground">
          <strong>Note:</strong> Suggested weights are normalized to ensure sum = 100%
        </div>
      </div>
    </div>
  );
}