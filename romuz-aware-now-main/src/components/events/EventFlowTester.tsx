/**
 * Week 9-10: Event Flow Testing Component
 * 
 * Interactive testing tool for event triggers and handlers
 */

import { useState } from 'react';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Separator } from '@/core/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Play, CheckCircle2, XCircle, Clock, Zap, Code } from 'lucide-react';
import { useEventBus } from '@/lib/events';
import { toast } from 'sonner';
import type { EventCategory } from '@/lib/events';

interface TestResult {
  timestamp: string;
  event_type: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  duration?: number;
  details?: any;
}

const SAMPLE_EVENT_TYPES: Record<EventCategory, string[]> = {
  policy: ['policy_created', 'policy_updated', 'policy_published'],
  action: ['action_created', 'action_completed', 'action_overdue'],
  campaign: ['campaign_started', 'campaign_completed'],
  auth: ['user_login', 'user_logout'],
  kpi: ['kpi_threshold_breached'],
  analytics: ['report_generated'],
  training: ['training_completed'],
  awareness: ['awareness_score_computed'],
  phishing: ['simulation_launched'],
  document: ['document_uploaded'],
  committee: ['meeting_scheduled'],
  content: ['content_published'],
  culture: ['culture_score_updated'],
  objective: ['objective_achieved'],
  alert: ['alert_triggered'],
  admin: ['user_account_created', 'settings_updated'],
  grc: ['policy_approved', 'risk_identified'],
  platform: ['tenant_created', 'subscription_updated'],
  system: ['system_health_check'],
};

export function EventFlowTester() {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('policy');
  const [selectedEventType, setSelectedEventType] = useState('policy_created');
  const [customPayload, setCustomPayload] = useState('{\n  "policy_code": "SEC-001",\n  "policy_title": "سياسة اختبار"\n}');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { publishEvent } = useEventBus();

  const runTest = async () => {
    setIsRunning(true);
    const startTime = Date.now();

    try {
      // Validate JSON payload
      let payload = {};
      try {
        payload = JSON.parse(customPayload);
      } catch (e) {
        throw new Error('Invalid JSON payload');
      }

      // Publish test event
      const result = await publishEvent({
        event_type: selectedEventType,
        event_category: selectedCategory,
        source_module: 'event_tester',
        entity_type: 'test',
        entity_id: `test_${Date.now()}`,
        priority: 'medium',
        payload,
        metadata: {
          test: true,
          test_timestamp: new Date().toISOString(),
        },
      });

      const duration = Date.now() - startTime;

      const testResult: TestResult = {
        timestamp: new Date().toISOString(),
        event_type: selectedEventType,
        status: 'success',
        message: 'Event published successfully',
        duration,
        details: result,
      };

      setTestResults([testResult, ...testResults]);
      toast.success('تم نشر الحدث بنجاح', {
        description: `المدة: ${duration}ms`,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        timestamp: new Date().toISOString(),
        event_type: selectedEventType,
        status: 'error',
        message: error.message || 'Failed to publish event',
        duration,
        details: error,
      };

      setTestResults([testResult, ...testResults]);
      toast.error('فشل نشر الحدث', {
        description: error.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    toast.info('تم مسح النتائج');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      pending: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status]} className="gap-1">
        {getStatusIcon(status)}
        {status === 'success' ? 'نجح' : status === 'error' ? 'فشل' : 'قيد التنفيذ'}
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Test Configuration */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">اختبار تدفق الأحداث</h3>
          </div>

          <p className="text-sm text-muted-foreground">
            اختبر نشر الأحداث وتنفيذ القواعد التلقائية
          </p>

          <Separator />

          {/* Event Category */}
          <div className="space-y-2">
            <Label>فئة الحدث</Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value as EventCategory);
                const firstEvent = SAMPLE_EVENT_TYPES[value as EventCategory]?.[0];
                if (firstEvent) setSelectedEventType(firstEvent);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="policy">السياسات</SelectItem>
                <SelectItem value="action">الإجراءات</SelectItem>
                <SelectItem value="campaign">الحملات</SelectItem>
                <SelectItem value="auth">المصادقة</SelectItem>
                <SelectItem value="kpi">مؤشرات الأداء</SelectItem>
                <SelectItem value="system">النظام</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label>نوع الحدث</Label>
            <Select
              value={selectedEventType}
              onValueChange={setSelectedEventType}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_EVENT_TYPES[selectedCategory]?.map(eventType => (
                  <SelectItem key={eventType} value={eventType}>
                    {eventType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Payload */}
          <div className="space-y-2">
            <Label>البيانات (JSON)</Label>
            <Textarea
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              placeholder='{"key": "value"}'
              className="font-mono text-sm"
              rows={8}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={runTest}
              disabled={isRunning}
              className="flex-1 gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'جاري التنفيذ...' : 'تشغيل الاختبار'}
            </Button>
            <Button
              variant="outline"
              onClick={clearResults}
              disabled={testResults.length === 0}
            >
              مسح
            </Button>
          </div>

          {/* Help */}
          <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">💡 كيفية الاستخدام:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>اختر فئة ونوع الحدث</li>
              <li>عدّل البيانات حسب الحاجة</li>
              <li>اضغط "تشغيل الاختبار"</li>
              <li>راقب النتائج والقواعد المشغلة</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Test Results */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">نتائج الاختبار</h3>
            </div>
            <Badge variant="outline">
              {testResults.length} اختبار
            </Badge>
          </div>

          <Separator />

          {testResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 opacity-20 mb-3" />
              <p>لا توجد نتائج بعد</p>
              <p className="text-sm">قم بتشغيل اختبار لعرض النتائج</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {testResults.map((result, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      {/* Result Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{result.event_type}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString('ar-SA')}
                          </div>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>

                      {/* Result Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">الحالة:</span>
                          <span>{result.message}</span>
                        </div>
                        {result.duration && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">المدة:</span>
                            <Badge variant="outline">{result.duration}ms</Badge>
                          </div>
                        )}
                      </div>

                      {/* Result Details (JSON) */}
                      {result.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            عرض التفاصيل
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </Card>
    </div>
  );
}
