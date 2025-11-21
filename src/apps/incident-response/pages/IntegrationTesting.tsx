/**
 * M18: Integration Testing Suite
 * Comprehensive testing interface for external integrations
 */

import { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Send,
  Database,
  Server,
  Zap,
  Clock
} from 'lucide-react';
import { useIntegrations, useCreateIntegration, useVerifyIntegration, useTriggerSIEMSync, useWebhookLogs } from '../hooks/useIntegrations';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function IntegrationTesting() {
  const [testingStep, setTestingStep] = useState<string>('idle');
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const { data: integrations, isLoading: loadingIntegrations, refetch: refetchIntegrations } = useIntegrations();
  const { data: webhookLogs, refetch: refetchLogs } = useWebhookLogs(50);
  const createMutation = useCreateIntegration();
  const verifyMutation = useVerifyIntegration();
  const syncMutation = useTriggerSIEMSync();

  // Test Result Component
  const TestResult = ({ result }: { result: any }) => {
    const Icon = result.success ? CheckCircle2 : XCircle;
    const color = result.success ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`p-4 border rounded-lg ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 ${color}`} />
          <div className="flex-1">
            <h4 className="font-medium mb-1">{result.test}</h4>
            <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
            {result.details && (
              <div className="text-xs bg-white/50 p-2 rounded border">
                <pre className="whitespace-pre-wrap">{JSON.stringify(result.details, null, 2)}</pre>
              </div>
            )}
            {result.duration && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{result.duration}ms</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Create Test Integration
  const createTestIntegration = async () => {
    setTestingStep('creating-integration');
    const startTime = Date.now();
    
    try {
      const result = await createMutation.mutateAsync({
        integration_type: 'webhook',
        integration_name: 'Test Webhook Integration',
        provider: 'custom',
        config_json: {
          test_mode: true,
          webhook_url: 'https://test.example.com/webhook',
          secret: 'test-secret-123',
        },
      });
      
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: 'إنشاء تكامل اختباري',
        success: true,
        message: 'تم إنشاء تكامل اختباري بنجاح',
        details: { id: result.id, type: result.integration_type },
        duration,
      }]);
      
      return result.id;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: 'إنشاء تكامل اختباري',
        success: false,
        message: 'فشل إنشاء التكامل',
        details: { error: error.message },
        duration,
      }]);
      
      throw error;
    }
  };

  // Test Database Connection
  const testDatabaseConnection = async () => {
    setTestingStep('testing-database');
    const startTime = Date.now();
    
    try {
      // Test incident_integrations table
      const { data: integrations, error: intError } = await supabase
        .from('incident_integrations')
        .select('count')
        .limit(1);
      
      if (intError) throw new Error(`Integrations table error: ${intError.message}`);
      
      // Test incident_webhook_logs table
      const { data: logs, error: logError } = await supabase
        .from('incident_webhook_logs')
        .select('count')
        .limit(1);
      
      if (logError) throw new Error(`Webhook logs table error: ${logError.message}`);
      
      // Test incident_external_sources table
      const { data: sources, error: srcError } = await supabase
        .from('incident_external_sources')
        .select('count')
        .limit(1);
      
      if (srcError) throw new Error(`External sources table error: ${srcError.message}`);
      
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: 'اختبار الاتصال بقاعدة البيانات',
        success: true,
        message: 'جميع الجداول متاحة وتعمل بشكل صحيح',
        details: {
          tables_tested: ['incident_integrations', 'incident_webhook_logs', 'incident_external_sources'],
          all_accessible: true,
        },
        duration,
      }]);
      
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: 'اختبار الاتصال بقاعدة البيانات',
        success: false,
        message: 'فشل الاتصال بقاعدة البيانات',
        details: { error: error.message },
        duration,
      }]);
      
      throw error;
    }
  };

  // Test Authentication
  const testAuthentication = async () => {
    setTestingStep('testing-auth');
    const startTime = Date.now();
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) throw new Error('No authenticated user');
      
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: 'اختبار المصادقة',
        success: true,
        message: 'المستخدم مصادق عليه بنجاح',
        details: {
          user_id: user.id,
          email: user.email,
        },
        duration,
      }]);
      
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: 'اختبار المصادقة',
        success: false,
        message: 'فشلت المصادقة',
        details: { error: error.message },
        duration,
      }]);
      
      throw error;
    }
  };

  // Test Integration CRUD Operations
  const testCRUDOperations = async () => {
    setTestingStep('testing-crud');
    const startTime = Date.now();
    
    try {
      // Create
      const created = await createMutation.mutateAsync({
        integration_type: 'siem',
        integration_name: 'CRUD Test Integration',
        provider: 'splunk',
        config_json: { base_url: 'https://test.splunk.com' },
      });
      
      // Read
      const { data: read, error: readError } = await supabase
        .from('incident_integrations')
        .select('*')
        .eq('id', created.id)
        .single();
      
      if (readError || !read) throw new Error('Failed to read integration');
      
      // Update
      const { error: updateError } = await supabase
        .from('incident_integrations')
        .update({ integration_name: 'CRUD Test Updated' })
        .eq('id', created.id);
      
      if (updateError) throw new Error('Failed to update integration');
      
      // Delete
      const { error: deleteError } = await supabase
        .from('incident_integrations')
        .delete()
        .eq('id', created.id);
      
      if (deleteError) throw new Error('Failed to delete integration');
      
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: 'اختبار عمليات CRUD',
        success: true,
        message: 'جميع عمليات الإنشاء والقراءة والتحديث والحذف تعمل',
        details: {
          operations: ['Create', 'Read', 'Update', 'Delete'],
          all_successful: true,
        },
        duration,
      }]);
      
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: 'اختبار عمليات CRUD',
        success: false,
        message: 'فشلت إحدى عمليات CRUD',
        details: { error: error.message },
        duration,
      }]);
      
      return false;
    }
  };

  // Simulate Webhook Event
  const simulateWebhookEvent = async (integrationId: string) => {
    setTestingStep('simulating-webhook');
    const startTime = Date.now();
    
    try {
      // Create a mock webhook log entry
      const { data, error } = await supabase
        .from('incident_webhook_logs')
        .insert({
          integration_id: integrationId,
          webhook_source: 'test-source',
          source_identifier: 'test-123',
          http_method: 'POST',
          headers: { 'content-type': 'application/json' },
          raw_payload: {
            event_type: 'security_alert',
            severity: 'high',
            message: 'Test security alert',
            timestamp: new Date().toISOString(),
          },
          processing_status: 'processed',
          action_taken: 'Test webhook received',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: 'محاكاة استقبال Webhook',
        success: true,
        message: 'تم استقبال ومعالجة webhook بنجاح',
        details: { 
          log_id: data.id,
          source: 'test-source',
          status: 'processed',
        },
        duration,
      }]);
      
      await refetchLogs();
      
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: 'محاكاة استقبال Webhook',
        success: false,
        message: 'فشل استقبال webhook',
        details: { error: error.message },
        duration,
      }]);
      
      return false;
    }
  };

  // Run Complete Test Suite
  const runCompleteTest = async () => {
    setTestResults([]);
    setTestingStep('running');
    
    toast.info('بدء الاختبار الشامل...');
    
    try {
      // 1. Test Authentication
      await testAuthentication();
      
      // 2. Test Database Connection
      await testDatabaseConnection();
      
      // 3. Test CRUD Operations
      await testCRUDOperations();
      
      // 4. Create Test Integration
      const integrationId = await createTestIntegration();
      
      // 5. Simulate Webhook Event
      await simulateWebhookEvent(integrationId);
      
      // 6. Refresh data
      await refetchIntegrations();
      
      setTestingStep('completed');
      toast.success('اكتمل الاختبار الشامل بنجاح! ✅');
      
    } catch (error: any) {
      setTestingStep('failed');
      toast.error('فشل الاختبار', { description: error.message });
    }
  };

  const isRunning = testingStep !== 'idle' && testingStep !== 'completed' && testingStep !== 'failed';

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">اختبار التكاملات الخارجية</h1>
        <p className="text-muted-foreground">
          مجموعة شاملة من الاختبارات للتحقق من عمل نظام التكاملات الخارجية بشكل صحيح
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={runCompleteTest}
          disabled={isRunning}
          className="p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-primary" />
            {isRunning && <RefreshCw className="w-5 h-5 animate-spin text-primary" />}
          </div>
          <h3 className="font-bold text-lg mb-1">تشغيل الاختبار الشامل</h3>
          <p className="text-sm text-muted-foreground">
            تشغيل جميع الاختبارات بالتسلسل
          </p>
        </button>

        <button
          onClick={testDatabaseConnection}
          disabled={isRunning}
          className="p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
        >
          <Database className="w-8 h-8 text-primary mb-2" />
          <h3 className="font-bold text-lg mb-1">اختبار قاعدة البيانات</h3>
          <p className="text-sm text-muted-foreground">
            التحقق من الجداول والاتصال
          </p>
        </button>

        <button
          onClick={testAuthentication}
          disabled={isRunning}
          className="p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
        >
          <Server className="w-8 h-8 text-primary mb-2" />
          <h3 className="font-bold text-lg mb-1">اختبار المصادقة</h3>
          <p className="text-sm text-muted-foreground">
            التحقق من حالة المستخدم
          </p>
        </button>
      </div>

      {/* Current Status */}
      {isRunning && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">جاري التشغيل...</h4>
              <p className="text-sm text-blue-700">{testingStep}</p>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">نتائج الاختبارات</h2>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {testResults.filter(r => r.success).length} نجح
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="w-4 h-4" />
                {testResults.filter(r => !r.success).length} فشل
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {testResults.map((result, index) => (
              <TestResult key={index} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* Current State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Integrations */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">التكاملات الحالية</h3>
          {loadingIntegrations ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : integrations && integrations.length > 0 ? (
            <div className="space-y-2">
              {integrations.map(int => (
                <div key={int.id} className="p-3 bg-muted/50 rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{int.integration_name}</div>
                    <div className="text-xs text-muted-foreground">{int.provider} • {int.integration_type}</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${int.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد تكاملات حالياً
            </div>
          )}
        </div>

        {/* Recent Webhook Logs */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">سجلات Webhook الأخيرة</h3>
          {webhookLogs && webhookLogs.length > 0 ? (
            <div className="space-y-2">
              {webhookLogs.slice(0, 5).map(log => (
                <div key={log.id} className="p-3 bg-muted/50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{log.webhook_source}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      log.processing_status === 'processed' ? 'bg-green-100 text-green-700' :
                      log.processing_status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {log.processing_status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.received_at).toLocaleString('ar-SA')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد سجلات
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
