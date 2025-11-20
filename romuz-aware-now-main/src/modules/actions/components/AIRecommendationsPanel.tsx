/**
 * AI Recommendations Panel Component
 * M11: AI-powered action suggestions and insights
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Separator } from '@/core/components/ui/separator';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import {
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Target,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Brain,
  Shield,
  Zap,
} from 'lucide-react';
import {
  useActionSuggestions,
  useActionRisks,
  useActionOptimizations,
  useActionNextSteps,
  useTriggerAIAnalysis,
} from '../hooks/useActionAI';

interface AIRecommendationsPanelProps {
  actionId: string;
  actionTitle: string;
}

export function AIRecommendationsPanel({ actionId, actionTitle }: AIRecommendationsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('suggestions');
  
  const suggestions = useActionSuggestions(actionId, activeTab === 'suggestions');
  const risks = useActionRisks(actionId, activeTab === 'risks');
  const optimizations = useActionOptimizations(actionId, activeTab === 'optimizations');
  const nextSteps = useActionNextSteps(actionId, activeTab === 'next-steps');
  const triggerAnalysis = useTriggerAIAnalysis();

  const handleRefresh = () => {
    const analysisType = {
      'suggestions': 'suggestions' as const,
      'risks': 'risk_assessment' as const,
      'optimizations': 'optimization' as const,
      'next-steps': 'next_steps' as const,
    }[activeTab];

    if (analysisType) {
      triggerAnalysis.mutate({ actionId, analysisType });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                التوصيات الذكية
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
              </CardTitle>
              <CardDescription>
                توصيات مدعومة بالذكاء الاصطناعي لتحسين: {actionTitle}
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={triggerAnalysis.isPending}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${triggerAnalysis.isPending ? 'animate-spin' : ''}`} />
            {triggerAnalysis.isPending ? 'جاري التحليل...' : 'تحديث'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="suggestions" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              اقتراحات
            </TabsTrigger>
            <TabsTrigger value="risks" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              المخاطر
            </TabsTrigger>
            <TabsTrigger value="optimizations" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              التحسينات
            </TabsTrigger>
            <TabsTrigger value="next-steps" className="gap-2">
              <Target className="h-4 w-4" />
              الخطوات التالية
            </TabsTrigger>
          </TabsList>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4 mt-6">
            {suggestions.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">جاري تحليل الإجراء...</p>
              </div>
            ) : suggestions.error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {suggestions.error instanceof Error
                    ? suggestions.error.message
                    : 'فشل تحميل التوصيات'}
                </AlertDescription>
              </Alert>
            ) : suggestions.data && suggestions.data.length > 0 ? (
              <div className="space-y-3">
                {suggestions.data.map((suggestion, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Lightbulb className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-foreground">{suggestion.title}</h4>
                            <Badge variant={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority === 'high' ? 'عالية' : 
                               suggestion.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {suggestion.description}
                          </p>
                          <Separator />
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Target className="h-3 w-3" />
                            <span className="font-medium">الأثر المتوقع:</span>
                            <span>{suggestion.impact}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد اقتراحات متاحة حالياً</p>
              </div>
            )}
          </TabsContent>

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-4 mt-6">
            {risks.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">جاري تقييم المخاطر...</p>
              </div>
            ) : risks.error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {risks.error instanceof Error
                    ? risks.error.message
                    : 'فشل تحميل تقييم المخاطر'}
                </AlertDescription>
              </Alert>
            ) : risks.data && risks.data.length > 0 ? (
              <div className="space-y-3">
                {risks.data.map((risk, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-foreground">{risk.title}</h4>
                            <Badge
                              variant="outline"
                              className={getSeverityColor(risk.severity)}
                            >
                              {risk.severity === 'critical' ? 'حرج' :
                               risk.severity === 'high' ? 'عالي' :
                               risk.severity === 'medium' ? 'متوسط' : 'منخفض'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {risk.description}
                          </p>
                          <Separator />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" />
                                احتمالية: {risk.likelihood === 'high' ? 'عالية' :
                                          risk.likelihood === 'medium' ? 'متوسطة' : 'منخفضة'}
                              </Badge>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Shield className="h-3 w-3 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-medium">الإجراء الوقائي:</span>
                                <p className="mt-1">{risk.mitigation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-600" />
                <p>لا توجد مخاطر محددة حالياً</p>
                <p className="text-xs mt-2">الإجراء يسير بشكل جيد</p>
              </div>
            )}
          </TabsContent>

          {/* Optimizations Tab */}
          <TabsContent value="optimizations" className="space-y-4 mt-6">
            {optimizations.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">جاري البحث عن تحسينات...</p>
              </div>
            ) : optimizations.error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {optimizations.error instanceof Error
                    ? optimizations.error.message
                    : 'فشل تحميل التحسينات'}
                </AlertDescription>
              </Alert>
            ) : optimizations.data && optimizations.data.length > 0 ? (
              <div className="space-y-3">
                {optimizations.data.map((optimization, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold text-foreground">{optimization.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {optimization.description}
                          </p>
                          <Separator />
                          <div className="flex items-center gap-3 text-xs">
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              الجهد: {optimization.effort === 'low' ? 'منخفض' :
                                      optimization.effort === 'medium' ? 'متوسط' : 'عالي'}
                            </Badge>
                            <Badge variant="default" className="gap-1">
                              <TrendingUp className="h-3 w-3" />
                              الأثر: {optimization.impact === 'high' ? 'عالي' :
                                      optimization.impact === 'medium' ? 'متوسط' : 'منخفض'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد تحسينات مقترحة حالياً</p>
              </div>
            )}
          </TabsContent>

          {/* Next Steps Tab */}
          <TabsContent value="next-steps" className="space-y-4 mt-6">
            {nextSteps.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">جاري تحديد الخطوات...</p>
              </div>
            ) : nextSteps.error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {nextSteps.error instanceof Error
                    ? nextSteps.error.message
                    : 'فشل تحميل الخطوات'}
                </AlertDescription>
              </Alert>
            ) : nextSteps.data && nextSteps.data.length > 0 ? (
              <div className="space-y-3">
                {nextSteps.data.map((step, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                            {step.order}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-foreground">{step.action}</h4>
                            <Badge variant={getPriorityColor(step.priority)}>
                              {step.priority === 'high' ? 'عالية' :
                               step.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                          <Button variant="outline" size="sm" className="gap-2 mt-2">
                            <ArrowRight className="h-3 w-3" />
                            تنفيذ الخطوة
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-600" />
                <p>لا توجد خطوات إضافية مطلوبة</p>
                <p className="text-xs mt-2">الإجراء على المسار الصحيح</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
