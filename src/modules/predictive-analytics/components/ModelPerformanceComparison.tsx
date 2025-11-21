/**
 * M19: Model Performance Comparison Component
 * Side-by-side comparison of ML models
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Progress } from '@/core/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Award,
  Target,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelComparisonData {
  id: string;
  name: string;
  type: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse: number;
  rmse: number;
  mae: number;
  trainingTime: number;
  predictionTime: number;
  totalPredictions: number;
  correctPredictions: number;
  lastTrainedAt: string;
  status: 'active' | 'inactive' | 'training';
}

interface ModelPerformanceComparisonProps {
  models: ModelComparisonData[];
  onSelectModel?: (modelId: string) => void;
}

export function ModelPerformanceComparison({ 
  models,
  onSelectModel 
}: ModelPerformanceComparisonProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [comparisonMetric, setComparisonMetric] = useState<string>('accuracy');

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else if (prev.length < 3) {
        return [...prev, modelId];
      }
      return prev;
    });
  };

  const selectedModelsData = models.filter(m => selectedModels.includes(m.id));

  const getMetricValue = (model: ModelComparisonData, metric: string): number => {
    switch (metric) {
      case 'accuracy': return model.accuracy * 100;
      case 'precision': return model.precision * 100;
      case 'recall': return model.recall * 100;
      case 'f1Score': return model.f1Score * 100;
      case 'mse': return model.mse;
      case 'rmse': return model.rmse;
      case 'mae': return model.mae;
      default: return 0;
    }
  };

  const getBestModel = () => {
    if (selectedModelsData.length === 0) return null;
    return selectedModelsData.reduce((best, current) => 
      getMetricValue(current, comparisonMetric) > getMetricValue(best, comparisonMetric) 
        ? current 
        : best
    );
  };

  const getTrendIcon = (value: number) => {
    if (value >= 90) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value >= 70) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const bestModel = getBestModel();

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>مقارنة النماذج</CardTitle>
              <CardDescription>
                اختر حتى 3 نماذج للمقارنة
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={comparisonMetric} onValueChange={setComparisonMetric}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accuracy">الدقة</SelectItem>
                  <SelectItem value="precision">Precision</SelectItem>
                  <SelectItem value="recall">Recall</SelectItem>
                  <SelectItem value="f1Score">F1 Score</SelectItem>
                  <SelectItem value="mse">MSE</SelectItem>
                  <SelectItem value="rmse">RMSE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => toggleModelSelection(model.id)}
                className={cn(
                  "p-4 rounded-lg border-2 text-right transition-all",
                  selectedModels.includes(model.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{model.name}</h4>
                    <p className="text-xs text-muted-foreground">{model.type}</p>
                  </div>
                  {selectedModels.includes(model.id) && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    model.accuracy >= 0.9 ? 'default' :
                    model.accuracy >= 0.7 ? 'secondary' :
                    'outline'
                  }>
                    {(model.accuracy * 100).toFixed(1)}%
                  </Badge>
                  {model.status === 'active' && (
                    <Badge variant="outline" className="text-green-600">
                      نشط
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedModelsData.length > 0 && (
        <>
          {/* Best Model Highlight */}
          {bestModel && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">أفضل نموذج - {bestModel.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">الدقة</p>
                    <p className="text-2xl font-bold">{(bestModel.accuracy * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">F1 Score</p>
                    <p className="text-2xl font-bold">{(bestModel.f1Score * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">التنبؤات</p>
                    <p className="text-2xl font-bold">{bestModel.totalPredictions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">وقت التنبؤ</p>
                    <p className="text-2xl font-bold">{bestModel.predictionTime}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>المقارنة التفصيلية</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="metrics">
                <TabsList>
                  <TabsTrigger value="metrics">
                    <Target className="h-4 w-4 ml-2" />
                    المقاييس
                  </TabsTrigger>
                  <TabsTrigger value="performance">
                    <Activity className="h-4 w-4 ml-2" />
                    الأداء
                  </TabsTrigger>
                  <TabsTrigger value="usage">
                    <Clock className="h-4 w-4 ml-2" />
                    الاستخدام
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="metrics" className="space-y-6 mt-6">
                  {/* Accuracy Comparison */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      الدقة (Accuracy)
                    </h4>
                    {selectedModelsData.map((model) => (
                      <div key={model.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{model.name}</span>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(model.accuracy * 100)}
                            <span>{(model.accuracy * 100).toFixed(2)}%</span>
                          </div>
                        </div>
                        <Progress value={model.accuracy * 100} />
                      </div>
                    ))}
                  </div>

                  {/* Precision & Recall */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Precision</h4>
                      {selectedModelsData.map((model) => (
                        <div key={model.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>{model.name}</span>
                            <span className="font-medium">{(model.precision * 100).toFixed(2)}%</span>
                          </div>
                          <Progress value={model.precision * 100} />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Recall</h4>
                      {selectedModelsData.map((model) => (
                        <div key={model.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>{model.name}</span>
                            <span className="font-medium">{(model.recall * 100).toFixed(2)}%</span>
                          </div>
                          <Progress value={model.recall * 100} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* F1 Score */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">F1 Score</h4>
                    {selectedModelsData.map((model) => (
                      <div key={model.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{model.name}</span>
                          <span className="font-medium">{(model.f1Score * 100).toFixed(2)}%</span>
                        </div>
                        <Progress value={model.f1Score * 100} />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedModelsData.map((model) => (
                      <Card key={model.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{model.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">MSE</span>
                            <span className="font-medium">{model.mse.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">RMSE</span>
                            <span className="font-medium">{model.rmse.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">MAE</span>
                            <span className="font-medium">{model.mae.toFixed(4)}</span>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">وقت التدريب</span>
                              <span className="font-medium">{model.trainingTime}s</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="usage" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedModelsData.map((model) => (
                      <Card key={model.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{model.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">إجمالي التنبؤات</span>
                            <span className="font-medium">{model.totalPredictions}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">تنبؤات صحيحة</span>
                            <span className="font-medium">{model.correctPredictions}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">معدل النجاح</span>
                            <span className="font-medium">
                              {((model.correctPredictions / model.totalPredictions) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">وقت التنبؤ</span>
                              <span className="font-medium">{model.predictionTime}ms</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {selectedModelsData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">اختر نماذج للمقارنة من القائمة أعلاه</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
