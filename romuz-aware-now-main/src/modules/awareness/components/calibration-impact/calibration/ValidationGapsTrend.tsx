// Gate-J Part 4.4: Validation Gaps Trend Chart
// Line chart showing validation gaps over time

import { Card } from '@/core/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/core/components/ui/skeleton';

interface ValidationGapsTrendProps {
  tenantId: string;
}

export function ValidationGapsTrend({ tenantId }: ValidationGapsTrendProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['validation-gaps-trend', tenantId],
    queryFn: async () => {
      // Fetch all calibration runs ordered by period
      const { data: runs, error } = await supabase
        .from('awareness_impact_calibration_runs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('period_start', { ascending: true });

      if (error) throw error;

      // Transform data for chart
      return runs.map(run => ({
        period: run.period_start ? new Date(run.period_start).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'N/A',
        avgGap: run.avg_validation_gap || 0,
        correlation: run.correlation_score || 0,
        sampleSize: run.sample_size || 0,
      }));
    },
    enabled: !!tenantId,
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        Not enough data to display trend
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="period" 
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          yAxisId="left"
          label={{ value: 'Average Gap', angle: -90, position: 'insideLeft' }}
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          label={{ value: 'Correlation Score (%)', angle: 90, position: 'insideRight' }}
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{ fontSize: '12px' }}
          labelStyle={{ fontWeight: 'bold' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="avgGap"
          stroke="hsl(var(--destructive))"
          strokeWidth={2}
          name="Average Gap"
          dot={{ r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="correlation"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          name="Correlation Score"
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}