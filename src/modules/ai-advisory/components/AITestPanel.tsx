/**
 * M16: AI Advisory Test Panel
 * Interactive testing interface for AI recommendations
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Loader2, PlayCircle, CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { requestAdvisory } from '../integration/ai-advisory.integration';
import type { ContextType } from '../types/ai-advisory.types';

interface TestCase {
  id: string;
  name: string;
  context_type: ContextType;
  context_id?: string;
}

export function AITestPanel() {
  const { tenantId } = useAppContext();
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  // Fetch available campaigns for testing
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['test-campaigns', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('awareness_campaigns')
        .select('id, name, status')
        .eq('tenant_id', tenantId)
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const testCases: TestCase[] = [
    // Campaign tests
    ...campaigns.map(c => ({
      id: c.id,
      name: `حملة: ${c.name}`,
      context_type: 'campaign' as ContextType,
      context_id: c.id,
    })),
    
    // Generic context tests (no specific ID needed)
    {
      id: 'test-risk',
      name: '🎯 اختبار: توصية مخاطر عامة',
      context_type: 'risk' as ContextType,
    },
    {
      id: 'test-compliance',
      name: '📋 اختبار: توصية امتثال عامة',
      context_type: 'compliance' as ContextType,
    },
    {
      id: 'test-audit',
      name: '🔍 اختبار: توصية تدقيق عامة',
      context_type: 'audit' as ContextType,
    },
  ];

  const runTest = async (testCase: TestCase) => {
    if (!tenantId) {
      setError('Tenant ID مفقود');
      return;
    }

    setIsRunning(true);
    setError(null);
    setTestResult(null);
    setDuration(0);

    const startTime = Date.now();

    try {
      // Fetch context data if context_id is provided
      let contextData = null;
      if (testCase.context_id && testCase.context_type === 'campaign') {
        const { data } = await supabase
          .from('awareness_campaigns')
          .select('*')
          .eq('id', testCase.context_id)
          .single();
        contextData = data;
      }

      console.log('🧪 Starting test:', {
        testCase: testCase.name,
        context_type: testCase.context_type,
        context_id: testCase.context_id,
        has_context_data: !!contextData,
      });

      // Generate a valid UUID for test cases without context_id
      const contextId = testCase.context_id || crypto.randomUUID();

      // Request recommendation
      const result = await requestAdvisory({
        context_type: testCase.context_type,
        context_id: contextId,
        context_data: contextData || {
          test_mode: true,
          test_name: testCase.name,
          generated_at: new Date().toISOString(),
        },
        language: 'both',
        tenant_id: tenantId,
      });

      const endTime = Date.now();
      setDuration(endTime - startTime);

      console.log('✅ Test completed:', result);

      if (result.success) {
        setTestResult(result);
      } else {
        setError(result.error || 'فشل الاختبار');
      }
    } catch (err: any) {
      console.error('❌ Test error:', err);
      setError(err.message || 'حدث خطأ أثناء الاختبار');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="flex items-center gap-2">
              لوحة الاختبار التفاعلية
              <Badge variant="outline">MVP Testing</Badge>
            </CardTitle>
            <CardDescription>اختبر نظام التوصيات الذكية بشكل دقيق</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Test Case Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">اختر سيناريو الاختبار:</label>
          <Select
            value={selectedTest?.id}
            onValueChange={(value) => {
              const test = testCases.find(t => t.id === value);
              setSelectedTest(test || null);
              setTestResult(null);
              setError(null);
            }}
            disabled={isRunning || loadingCampaigns}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر سيناريو..." />
            </SelectTrigger>
            <SelectContent>
              {loadingCampaigns && (
                <SelectItem value="loading" disabled>
                  جاري التحميل...
                </SelectItem>
              )}
              {testCases.map((test) => (
                <SelectItem key={test.id} value={test.id}>
                  {test.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Run Test Button */}
        {selectedTest && (
          <Button
            onClick={() => runTest(selectedTest)}
            disabled={isRunning}
            className="w-full gap-2"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الاختبار...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                تشغيل الاختبار
              </>
            )}
          </Button>
        )}

        {/* Test Results */}
        {isRunning && (
          <Alert>
            <Clock className="h-4 w-4 animate-pulse" />
            <AlertDescription>
              جاري استدعاء الذكاء الاصطناعي وتوليد التوصية...
            </AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {testResult?.success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="space-y-2">
              <div className="font-semibold text-green-800 dark:text-green-200">
                ✅ نجح الاختبار!
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>⏱️ وقت الاستجابة:</span>
                  <Badge variant="outline">{duration}ms</Badge>
                </div>
                <div className="flex justify-between">
                  <span>🤖 النموذج:</span>
                  <Badge>{testResult.recommendation?.model_used}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>📊 الثقة:</span>
                  <Badge variant="secondary">
                    {(testResult.recommendation?.confidence_score * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>⚡ الأولوية:</span>
                  <Badge 
                    variant={
                      testResult.recommendation?.priority === 'high' ? 'destructive' :
                      testResult.recommendation?.priority === 'medium' ? 'default' : 'outline'
                    }
                  >
                    {testResult.recommendation?.priority}
                  </Badge>
                </div>
              </div>
              {testResult.recommendation?.title_ar && (
                <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border">
                  <div className="font-medium text-xs mb-1">العنوان:</div>
                  <div className="text-sm">{testResult.recommendation.title_ar}</div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Result */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">❌ فشل الاختبار</div>
              <div className="text-sm">{error}</div>
            </AlertDescription>
          </Alert>
        )}

        {/* Test Info */}
        {selectedTest && !isRunning && !testResult && !error && (
          <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg space-y-1">
            <div><strong>نوع السياق:</strong> {selectedTest.context_type}</div>
            {selectedTest.context_id && (
              <div><strong>المعرّف:</strong> {selectedTest.context_id.slice(0, 8)}...</div>
            )}
            <div className="pt-2 text-xs">
              💡 سيتم استدعاء Lovable AI (Gemini 2.5 Flash) لتوليد توصية ذكية
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
