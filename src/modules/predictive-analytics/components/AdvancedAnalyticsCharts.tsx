/**
 * M19: Advanced Analytics Charts Component
 * Enhanced visualization for predictive analytics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, Zap } from 'lucide-react';

interface ModelMetrics {
  modelId: string;
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse: number;
  rmse: number;
  predictions: number;
  trend: 'up' | 'down' | 'stable';
}

interface PredictionTrend {
  date: string;
  predicted: number;
  actual: number;
  confidence: number;
}

interface FeatureImportance {
  feature: string;
  importance: number;
  category: string;
}

interface AdvancedAnalyticsChartsProps {
  models: ModelMetrics[];
  trends?: PredictionTrend[];
  featureImportance?: FeatureImportance[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AdvancedAnalyticsCharts({ 
  models, 
  trends = [],
  featureImportance = []
}: AdvancedAnalyticsChartsProps) {
  
  // Prepare radar chart data for model comparison
  const radarData = [
    {
      metric: 'الدقة',
      ...models.reduce((acc, m) => ({ ...acc, [m.modelName]: m.accuracy * 100 }), {})
    },
    {
      metric: 'الدقة الموجبة',
      ...models.reduce((acc, m) => ({ ...acc, [m.modelName]: m.precision * 100 }), {})
    },
    {
      metric: 'الاستدعاء',
      ...models.reduce((acc, m) => ({ ...acc, [m.modelName]: m.recall * 100 }), {})
    },
    {
      metric: 'F1 Score',
      ...models.reduce((acc, m) => ({ ...acc, [m.modelName]: m.f1Score * 100 }), {})
    },
  ];

  // Prepare scatter plot data for accuracy vs predictions
  const scatterData = models.map(m => ({
    name: m.modelName,
    accuracy: m.accuracy * 100,
    predictions: m.predictions,
    rmse: m.rmse,
  }));

  return (
    <div className="space-y-6">
      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.slice(0, 3).map((model, idx) => (
          <Card key={model.modelId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{model.modelName}</CardTitle>
                <Badge variant={
                  model.accuracy >= 0.9 ? 'default' : 
                  model.accuracy >= 0.7 ? 'secondary' : 
                  'outline'
                }>
                  {(model.accuracy * 100).toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Precision</span>
                  <span className="font-medium">{(model.precision * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Recall</span>
                  <span className="font-medium">{(model.recall * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">F1 Score</span>
                  <span className="font-medium">{(model.f1Score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">التنبؤات</span>
                  <div className="flex items-center gap-1">
                    {model.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {model.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                    <span className="font-medium">{model.predictions}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">
            <Activity className="h-4 w-4 ml-2" />
            الاتجاهات
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <Target className="h-4 w-4 ml-2" />
            المقارنة
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Zap className="h-4 w-4 ml-2" />
            الأداء
          </TabsTrigger>
          <TabsTrigger value="features">
            <TrendingUp className="h-4 w-4 ml-2" />
            الميزات
          </TabsTrigger>
        </TabsList>

        {/* Prediction Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>اتجاهات التنبؤ مقابل القيم الفعلية</CardTitle>
              <CardDescription>
                مقارنة التنبؤات مع النتائج الحقيقية عبر الزمن
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorPredicted)" 
                    name="التنبؤ"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    name="القيمة الفعلية"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Comparison Radar */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة أداء النماذج</CardTitle>
              <CardDescription>
                تحليل متعدد الأبعاد لمقاييس الأداء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  {models.map((model, idx) => (
                    <Radar
                      key={model.modelId}
                      name={model.modelName}
                      dataKey={model.modelName}
                      stroke={COLORS[idx % COLORS.length]}
                      fill={COLORS[idx % COLORS.length]}
                      fillOpacity={0.3}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Scatter */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>الدقة مقابل عدد التنبؤات</CardTitle>
              <CardDescription>
                تحليل العلاقة بين دقة النموذج وحجم التنبؤات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="predictions" 
                    name="التنبؤات" 
                    label={{ value: 'عدد التنبؤات', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="accuracy" 
                    name="الدقة" 
                    label={{ value: 'الدقة (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter 
                    name="النماذج" 
                    data={scatterData} 
                    fill="#3b82f6"
                  >
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Importance */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>أهمية الميزات</CardTitle>
              <CardDescription>
                الميزات الأكثر تأثيراً في التنبؤات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={featureImportance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="feature" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="importance" fill="#3b82f6" name="الأهمية">
                    {featureImportance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confidence Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع الثقة في التنبؤات</CardTitle>
          <CardDescription>
            مستويات الثقة عبر جميع التنبؤات الحديثة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="مستوى الثقة (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
