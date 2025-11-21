/**
 * M19: Advanced Analytics Page
 * Enhanced analytics with advanced charts
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { 
  AdvancedAnalyticsCharts,
  ModelPerformanceComparison 
} from '@/modules/predictive-analytics/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { TrendingUp, Target, Activity } from 'lucide-react';

// Mock data - في الإنتاج سيتم جلبها من API
const mockModels = [
  {
    modelId: '1',
    modelName: 'نموذج المخاطر',
    accuracy: 0.92,
    precision: 0.89,
    recall: 0.94,
    f1Score: 0.91,
    mse: 0.08,
    rmse: 0.28,
    predictions: 450,
    trend: 'up' as const,
  },
  {
    modelId: '2',
    modelName: 'نموذج الحوادث',
    accuracy: 0.87,
    precision: 0.85,
    recall: 0.89,
    f1Score: 0.87,
    mse: 0.13,
    rmse: 0.36,
    predictions: 320,
    trend: 'stable' as const,
  },
  {
    modelId: '3',
    modelName: 'نموذج الامتثال',
    accuracy: 0.95,
    precision: 0.93,
    recall: 0.97,
    f1Score: 0.95,
    mse: 0.05,
    rmse: 0.22,
    predictions: 280,
    trend: 'up' as const,
  },
];

const mockTrends = Array.from({ length: 30 }, (_, i) => ({
  date: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
  predicted: 70 + Math.random() * 20,
  actual: 68 + Math.random() * 22,
  confidence: 85 + Math.random() * 10,
}));

const mockFeatures = [
  { feature: 'خطورة الحدث', importance: 0.35, category: 'security' },
  { feature: 'عدد المحاولات', importance: 0.28, category: 'behavior' },
  { feature: 'التوقيت', importance: 0.18, category: 'temporal' },
  { feature: 'المصدر', importance: 0.12, category: 'network' },
  { feature: 'الحجم', importance: 0.07, category: 'volume' },
];

const mockComparisonData = [
  {
    id: '1',
    name: 'نموذج المخاطر v2.1',
    type: 'Random Forest',
    version: 'v2.1',
    accuracy: 0.92,
    precision: 0.89,
    recall: 0.94,
    f1Score: 0.91,
    mse: 0.08,
    rmse: 0.28,
    mae: 0.15,
    trainingTime: 45,
    predictionTime: 12,
    totalPredictions: 450,
    correctPredictions: 414,
    lastTrainedAt: '2025-11-15',
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'نموذج الحوادث v1.5',
    type: 'Gradient Boosting',
    version: 'v1.5',
    accuracy: 0.87,
    precision: 0.85,
    recall: 0.89,
    f1Score: 0.87,
    mse: 0.13,
    rmse: 0.36,
    mae: 0.22,
    trainingTime: 62,
    predictionTime: 18,
    totalPredictions: 320,
    correctPredictions: 278,
    lastTrainedAt: '2025-11-10',
    status: 'active' as const,
  },
  {
    id: '3',
    name: 'نموذج الامتثال v3.0',
    type: 'Neural Network',
    version: 'v3.0',
    accuracy: 0.95,
    precision: 0.93,
    recall: 0.97,
    f1Score: 0.95,
    mse: 0.05,
    rmse: 0.22,
    mae: 0.12,
    trainingTime: 120,
    predictionTime: 25,
    totalPredictions: 280,
    correctPredictions: 266,
    lastTrainedAt: '2025-11-18',
    status: 'active' as const,
  },
];

export default function AdvancedAnalytics() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">التحليلات المتقدمة</h1>
          <p className="text-muted-foreground mt-1">
            تحليل متعمق لأداء نماذج التنبؤ
          </p>
        </div>
        <Button>
          <Activity className="h-4 w-4 ml-2" />
          تحديث البيانات
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="charts">
            <TrendingUp className="h-4 w-4 ml-2" />
            الرسوم البيانية المتقدمة
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <Target className="h-4 w-4 ml-2" />
            مقارنة النماذج
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          <AdvancedAnalyticsCharts
            models={mockModels}
            trends={mockTrends}
            featureImportance={mockFeatures}
          />
        </TabsContent>

        <TabsContent value="comparison">
          <ModelPerformanceComparison
            models={mockComparisonData}
            onSelectModel={(id) => console.log('Selected:', id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
