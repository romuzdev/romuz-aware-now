/**
 * Rule Tester Component
 * 
 * واجهة اختبار قواعد الأتمتة
 */

import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import type { AutomationRule, SystemEvent } from '@/lib/events/event.types';
import {
  createTestEvent,
  simulateRuleExecution,
  testRuleWithEvents,
  generateSampleEvents,
} from '@/lib/events/utils/ruleTestinghelpers';

interface RuleTesterProps {
  rule: AutomationRule;
  onBack: () => void;
}

interface TestResult {
  eventId: string;
  eventType: string;
  matched: boolean;
  conditionsResult: boolean;
  actions: Array<{
    action_type: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
}

export function RuleTester({ rule, onBack }: RuleTesterProps) {
  const [testMode, setTestMode] = useState<'manual' | 'samples'>('manual');
  const [eventType, setEventType] = useState(rule.trigger_event_types[0] || '');
  const [eventPayload, setEventPayload] = useState<Record<string, any>>({});
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunManualTest = async () => {
    setIsRunning(true);
    try {
      const testEvent = createTestEvent(eventType, 'action', eventPayload);
      const result = await simulateRuleExecution(rule, testEvent);

      setTestResults([
        {
          eventId: testEvent.id,
          eventType: testEvent.event_type,
          matched: result.matches,
          conditionsResult: result.conditionResults.every((c) => c.result),
          actions: result.executionResults || [],
        },
      ]);
    } catch (error) {
      console.error('خطأ في الاختبار:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunSamplesTest = async () => {
    setIsRunning(true);
    try {
      const samples = generateSampleEvents();
      const summary = await testRuleWithEvents(rule, samples);

      setTestResults(
        summary.results.map((r) => ({
          eventId: r.event.id,
          eventType: r.event.event_type,
          matched: r.matched,
          conditionsResult: true,
          actions: [],
        }))
      );
    } catch (error) {
      console.error('خطأ في الاختبار:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setTestResults([]);
    setEventType(rule.trigger_event_types[0] || '');
    setEventPayload({});
  };

  const matchedCount = testResults.filter((r) => r.matched).length;
  const successCount = testResults.filter(
    (r) => r.matched && r.actions.every((a) => a.success)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>اختبار القاعدة: {rule.rule_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Test Mode Selection */}
            <div className="flex gap-2">
              <Button
                variant={testMode === 'manual' ? 'default' : 'outline'}
                onClick={() => setTestMode('manual')}
                disabled={isRunning}
              >
                اختبار يدوي
              </Button>
              <Button
                variant={testMode === 'samples' ? 'default' : 'outline'}
                onClick={() => setTestMode('samples')}
                disabled={isRunning}
              >
                اختبار بأحداث عينة
              </Button>
            </div>

            {/* Manual Test Input */}
            {testMode === 'manual' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    نوع الحدث
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isRunning}
                  >
                    {rule.trigger_event_types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    بيانات الحدث (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(eventPayload, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setEventPayload(parsed);
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={8}
                    className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    disabled={isRunning}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={testMode === 'manual' ? handleRunManualTest : handleRunSamplesTest}
                disabled={isRunning}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {isRunning ? 'جارٍ التنفيذ...' : 'تشغيل الاختبار'}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isRunning}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص النتائج</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-border rounded-md">
                  <p className="text-2xl font-bold text-foreground">{testResults.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الاختبارات</p>
                </div>
                <div className="text-center p-4 border border-border rounded-md">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {matchedCount}
                  </p>
                  <p className="text-sm text-muted-foreground">أحداث مطابقة</p>
                </div>
                <div className="text-center p-4 border border-border rounded-md">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {successCount}
                  </p>
                  <p className="text-sm text-muted-foreground">تنفيذات ناجحة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>نتائج تفصيلية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border border-border rounded-md p-4 space-y-3">
                    {/* Event Info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{result.eventType}</p>
                        <p className="text-xs text-muted-foreground">ID: {result.eventId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.matched ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">مطابق</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">غير مطابق</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Conditions Result */}
                    {result.matched && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">نتيجة الشروط: </span>
                        <span
                          className={
                            result.conditionsResult
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {result.conditionsResult ? 'نجح' : 'فشل'}
                        </span>
                      </div>
                    )}

                    {/* Actions Results */}
                    {result.actions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">الإجراءات:</p>
                        <div className="space-y-1">
                          {result.actions.map((action, actionIdx) => (
                            <div
                              key={actionIdx}
                              className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                            >
                              <span className="text-foreground">{action.action_type}</span>
                              {action.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-red-600 dark:text-red-400">
                                    {action.error}
                                  </span>
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
