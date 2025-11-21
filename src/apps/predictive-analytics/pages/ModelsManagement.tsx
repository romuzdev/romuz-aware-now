/**
 * M19 Part 2: Models Management Page
 * Manage ML models, training, and configurations
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { ModelCard } from '@/modules/predictive-analytics/components';
import { usePredictionModels } from '@/modules/predictive-analytics/hooks';
import { Plus, RefreshCw, Brain } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ModelsManagement() {
  const modelsQuery = usePredictionModels();
  const models = modelsQuery.data || [];
  const modelsLoading = modelsQuery.isLoading;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isTraining, setIsTraining] = useState(false);

  const categories = [
    { id: 'all', name: 'الكل' },
    { id: 'risk', name: 'المخاطر' },
    { id: 'incident', name: 'الحوادث' },
    { id: 'compliance', name: 'الامتثال' },
    { id: 'awareness', name: 'التوعية' },
  ];

  const filteredModels = models?.filter((model) => {
    if (selectedCategory === 'all') return true;
    const modelType = model.model_type?.toLowerCase() || '';
    return modelType.includes(selectedCategory);
  }) || [];

  const handleTrainModel = async (modelId: string) => {
    try {
      setIsTraining(true);
      
      const { error } = await supabase.functions.invoke('train-prediction-model', {
        body: { modelId },
      });

      if (error) throw error;

      toast({
        title: 'تم بدء التدريب',
        description: 'جاري تدريب النموذج',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في التدريب',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsTraining(false);
    }
  };

  const handleRunPrediction = async (modelId: string) => {
    try {
      const { error } = await supabase.functions.invoke('run-prediction', {
        body: { modelId },
      });

      if (error) throw error;

      toast({
        title: 'تم تنفيذ التنبؤ',
        description: 'تم إنشاء تنبؤ جديد بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في التنفيذ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة نماذج التعلم الآلي</h1>
          <p className="text-muted-foreground">
            تدريب وإدارة نماذج التنبؤ
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={isTraining}>
            <RefreshCw className={`h-4 w-4 ml-2 ${isTraining ? 'animate-spin' : ''}`} />
            تحديث الكل
          </Button>
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إنشاء نموذج
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {modelsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">جاري التحميل...</p>
              </CardContent>
            </Card>
          ) : filteredModels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onRun={handleRunPrediction}
                  onConfigure={(id) => console.log('Configure:', id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد نماذج في هذه الفئة</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء نموذج جديد
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
