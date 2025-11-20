import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { KPI, KPITarget, KPIReading } from "@/modules/objectives";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";

interface KPIChartProps {
  kpi: KPI;
  targets: KPITarget[];
  readings: KPIReading[];
}

export function KPIChart({ kpi, targets, readings }: KPIChartProps) {
  // Prepare data for chart
  const chartData = readings.map((reading) => {
    const target = targets.find((t) => t.period === reading.period);
    return {
      period: reading.period,
      actual: reading.actual_value,
      target: target?.target_value || null,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">لا توجد بيانات كافية لعرض الرسم البياني</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="line" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="line">خط</TabsTrigger>
        <TabsTrigger value="bar">أعمدة</TabsTrigger>
      </TabsList>

      <TabsContent value="line">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="القيمة الفعلية"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="القيمة المستهدفة"
            />
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>

      <TabsContent value="bar">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="actual" fill="hsl(var(--primary))" name="القيمة الفعلية" />
            <Bar
              dataKey="target"
              fill="hsl(var(--muted-foreground))"
              name="القيمة المستهدفة"
            />
          </BarChart>
        </ResponsiveContainer>
      </TabsContent>
    </Tabs>
  );
}
