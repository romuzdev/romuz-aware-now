/**
 * M18: Incident Response - Metrics Chart Component
 * Displays incident metrics using Recharts
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface MetricsChartProps {
  type: 'severity' | 'status' | 'type' | 'timeline';
  data: any;
  height?: number;
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const STATUS_COLORS = {
  open: '#ef4444',
  investigating: '#f97316',
  contained: '#eab308',
  resolved: '#22c55e',
  closed: '#64748b',
};

export function IncidentMetricsChart({ type, data, height = 300 }: MetricsChartProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  if (!data) {
    return null;
  }

  const renderSeverityChart = () => {
    const chartData = [
      { name: isRTL ? 'حرج' : 'Critical', value: data.critical || 0, color: SEVERITY_COLORS.critical },
      { name: isRTL ? 'عالي' : 'High', value: data.high || 0, color: SEVERITY_COLORS.high },
      { name: isRTL ? 'متوسط' : 'Medium', value: data.medium || 0, color: SEVERITY_COLORS.medium },
      { name: isRTL ? 'منخفض' : 'Low', value: data.low || 0, color: SEVERITY_COLORS.low },
    ];

    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderStatusChart = () => {
    const chartData = [
      { name: isRTL ? 'مفتوح' : 'Open', value: data.open || 0 },
      { name: isRTL ? 'قيد التحقيق' : 'Investigating', value: data.investigating || 0 },
      { name: isRTL ? 'محتوى' : 'Contained', value: data.contained || 0 },
      { name: isRTL ? 'محلول' : 'Resolved', value: data.resolved || 0 },
      { name: isRTL ? 'مغلق' : 'Closed', value: data.closed || 0 },
    ];

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#3b82f6" name={isRTL ? 'العدد' : 'Count'} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderTypeChart = () => {
    const chartData = Object.entries(data).map(([key, value]) => ({
      name: key.replace(/_/g, ' '),
      value: value as number,
    }));

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8b5cf6" name={isRTL ? 'العدد' : 'Count'} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderTimelineChart = () => {
    if (!Array.isArray(data)) return null;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#3b82f6" 
            name={isRTL ? 'عدد الحوادث' : 'Incident Count'} 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {type === 'severity' && (isRTL ? 'توزيع الخطورة' : 'Severity Distribution')}
          {type === 'status' && (isRTL ? 'توزيع الحالات' : 'Status Distribution')}
          {type === 'type' && (isRTL ? 'توزيع الأنواع' : 'Type Distribution')}
          {type === 'timeline' && (isRTL ? 'الاتجاه الزمني' : 'Timeline Trend')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {type === 'severity' && renderSeverityChart()}
        {type === 'status' && renderStatusChart()}
        {type === 'type' && renderTypeChart()}
        {type === 'timeline' && renderTimelineChart()}
      </CardContent>
    </Card>
  );
}
