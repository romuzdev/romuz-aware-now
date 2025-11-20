/**
 * Assessment Score Distribution Component
 * 
 * Displays distribution of assessment scores
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ScoreDistribution {
  range: string;
  count: number;
}

interface AssessmentScoreDistributionProps {
  data: ScoreDistribution[];
  title?: string;
}

export function AssessmentScoreDistribution({
  data,
  title = 'Score Distribution',
}: AssessmentScoreDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
