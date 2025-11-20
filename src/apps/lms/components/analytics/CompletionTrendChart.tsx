/**
 * Completion Trend Chart Component
 * 
 * Displays course completion trends over time
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  completions: number;
  enrollments: number;
}

interface CompletionTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
}

export function CompletionTrendChart({
  data,
  title = 'Completion Trends',
}: CompletionTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="enrollments"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Enrollments"
            />
            <Line
              type="monotone"
              dataKey="completions"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="Completions"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
