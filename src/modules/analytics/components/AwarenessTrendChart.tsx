import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailyEngagement } from '@/modules/campaigns';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface AwarenessTrendChartProps {
  data?: DailyEngagement[];
  isLoading?: boolean;
}

export function AwarenessTrendChart({ data, isLoading }: AwarenessTrendChartProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('awareness.analytics.trend.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('awareness.analytics.trend.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t('awareness.analytics.trend.empty')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    date: format(parseISO(d.day), 'MMM dd'),
    started: d.started_delta,
    completed: d.completed_delta,
    avgScore: d.avg_score_day || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('awareness.analytics.trend.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="started"
              stroke="hsl(var(--chart-1))"
              name={t('awareness.analytics.trend.series.started')}
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="completed"
              stroke="hsl(var(--chart-2))"
              name={t('awareness.analytics.trend.series.completed')}
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgScore"
              stroke="hsl(var(--chart-3))"
              name={t('awareness.analytics.trend.series.avgScore')}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
