/**
 * Connector Configuration Wizard
 * M15: Advanced step-by-step connector setup with validation
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  Key,
  Settings,
  TestTube,
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateConnectorInput, ConnectorType } from '../types';
import { toast } from 'sonner';

interface ConnectorConfigWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (input: CreateConnectorInput) => Promise<void>;
  connectorType?: string;
}

type WizardStep = 'type' | 'basic' | 'config' | 'test' | 'complete';

const STEPS: { id: WizardStep; label: string; icon: any }[] = [
  { id: 'type', label: 'نوع التكامل', icon: Settings },
  { id: 'basic', label: 'المعلومات الأساسية', icon: Circle },
  { id: 'config', label: 'الإعدادات', icon: Key },
  { id: 'test', label: 'اختبار الاتصال', icon: TestTube },
  { id: 'complete', label: 'إكمال', icon: Rocket },
];

const CONNECTOR_TYPES = [
  { value: 'slack' as const, label: 'Slack', icon: '💬', description: 'إرسال الإشعارات إلى Slack' },
  { value: 'teams' as const, label: 'Microsoft Teams', icon: '👥', description: 'التكامل مع Microsoft Teams' },
  { value: 'google_workspace' as const, label: 'Google Workspace', icon: '📁', description: 'مزامنة Drive والمستخدمين' },
  { value: 'odoo' as const, label: 'Odoo ERP', icon: '🏢', description: 'مزامنة بيانات الموظفين' },
  { value: 'webhook' as const, label: 'Webhook', icon: '🔗', description: 'استقبال الأحداث الخارجية' },
  { value: 'api' as const, label: 'REST API', icon: '🔌', description: 'API مخصص' },
];

export function ConnectorConfigWizard({
  isOpen,
  onClose,
  onComplete,
  connectorType,
}: ConnectorConfigWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const [formData, setFormData] = useState<CreateConnectorInput>({
    name: '',
    description: '',
    type: (connectorType as ConnectorType) || 'slack',
    config: {},
    sync_frequency_minutes: 60,
  });

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleNext = async () => {
    // Validation for each step
    if (currentStep === 'basic' && (!formData.name || !formData.description)) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (currentStep === 'config') {
      const isValid = validateConfig();
      if (!isValid) {
        toast.error('يرجى ملء جميع حقول الإعدادات المطلوبة');
        return;
      }
    }

    if (currentStep === 'test') {
      await handleTestConnection();
      if (testStatus !== 'success') return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }

    if (currentStep === 'test' && testStatus === 'success') {
      await handleComplete();
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const validateConfig = (): boolean => {
    switch (formData.type) {
      case 'slack':
        return !!formData.config.webhook_url;
      case 'google_workspace':
        return !!formData.config.client_id && !!formData.config.client_secret;
      case 'odoo':
        return !!formData.config.api_url && !!formData.config.api_key;
      default:
        return true;
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, call actual test endpoint
    const success = Math.random() > 0.2; // 80% success rate for demo
    
    setTestStatus(success ? 'success' : 'error');
    
    if (success) {
      toast.success('تم اختبار الاتصال بنجاح');
    } else {
      toast.error('فشل اختبار الاتصال', {
        description: 'يرجى التحقق من الإعدادات والمحاولة مرة أخرى'
      });
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(formData);
      toast.success('تم إنشاء التكامل بنجاح');
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error('فشل إنشاء التكامل', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'slack' as ConnectorType,
      config: {},
      sync_frequency_minutes: 60,
    });
    setCurrentStep('type');
    setTestStatus('idle');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'type':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              اختر نوع التكامل الذي تريد إعداده
            </p>
            <div className="grid grid-cols-2 gap-4">
              {CONNECTOR_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={cn(
                    "relative p-4 rounded-lg border-2 text-left transition-all hover:shadow-md",
                    formData.type === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{type.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">{type.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  {formData.type === type.value && (
                    <CheckCircle2 className="absolute top-2 left-2 w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 'basic':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">اسم التكامل *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: Slack - قناة الإشعارات"
              />
            </div>
            <div>
              <Label htmlFor="description">الوصف *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر للتكامل"
              />
            </div>
            <div>
              <Label htmlFor="sync_frequency">تكرار المزامنة (بالدقائق)</Label>
              <Input
                id="sync_frequency"
                type="number"
                min="1"
                value={formData.sync_frequency_minutes}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  sync_frequency_minutes: parseInt(e.target.value) || 60 
                })}
              />
            </div>
          </div>
        );

      case 'config':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              أدخل بيانات الاتصال للتكامل
            </p>
            {renderConfigFields()}
          </div>
        );

      case 'test':
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              {testStatus === 'idle' && (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <TestTube className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              {testStatus === 'testing' && (
                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
              )}
              {testStatus === 'success' && (
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
              )}
              {testStatus === 'error' && (
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium">
                {testStatus === 'idle' && 'جاهز لاختبار الاتصال'}
                {testStatus === 'testing' && 'جاري اختبار الاتصال...'}
                {testStatus === 'success' && 'اختبار الاتصال ناجح!'}
                {testStatus === 'error' && 'فشل اختبار الاتصال'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {testStatus === 'idle' && 'اضغط على "اختبار الاتصال" للمتابعة'}
                {testStatus === 'testing' && 'يرجى الانتظار...'}
                {testStatus === 'success' && 'يمكنك المتابعة لإكمال الإعداد'}
                {testStatus === 'error' && 'يرجى التحقق من الإعدادات والمحاولة مرة أخرى'}
              </p>
            </div>

            {testStatus === 'idle' && (
              <Button onClick={handleTestConnection} size="lg">
                <TestTube className="w-4 h-4 ml-2" />
                اختبار الاتصال
              </Button>
            )}

            {testStatus === 'error' && (
              <Button onClick={handleTestConnection} variant="outline" size="lg">
                <TestTube className="w-4 h-4 ml-2" />
                إعادة المحاولة
              </Button>
            )}
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <Rocket className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium">جاهز للإطلاق!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                تم إعداد التكامل بنجاح ويمكنك الآن استخدامه
              </p>
            </div>
          </div>
        );
    }
  };

  const renderConfigFields = () => {
    switch (formData.type) {
      case 'slack':
        return (
          <>
            <div>
              <Label htmlFor="webhook_url">Webhook URL *</Label>
              <Input
                id="webhook_url"
                type="url"
                value={formData.config.webhook_url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, webhook_url: e.target.value }
                })}
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
            <div>
              <Label htmlFor="channel">القناة (اختياري)</Label>
              <Input
                id="channel"
                value={formData.config.channel || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, channel: e.target.value }
                })}
                placeholder="#general"
              />
            </div>
          </>
        );

      case 'google_workspace':
        return (
          <>
            <div>
              <Label htmlFor="client_id">Client ID *</Label>
              <Input
                id="client_id"
                value={formData.config.client_id || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, client_id: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="client_secret">Client Secret *</Label>
              <Input
                id="client_secret"
                type="password"
                value={formData.config.client_secret || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, client_secret: e.target.value }
                })}
              />
            </div>
          </>
        );

      case 'odoo':
        return (
          <>
            <div>
              <Label htmlFor="api_url">API URL *</Label>
              <Input
                id="api_url"
                type="url"
                value={formData.config.api_url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_url: e.target.value }
                })}
                placeholder="https://your-instance.odoo.com"
              />
            </div>
            <div>
              <Label htmlFor="api_key">API Key *</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.config.api_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_key: e.target.value }
                })}
              />
            </div>
          </>
        );

      default:
        return <p className="text-sm text-muted-foreground">لا توجد إعدادات إضافية</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>معالج إعداد التكامل</DialogTitle>
          <DialogDescription>
            اتبع الخطوات لإعداد التكامل الخاص بك
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">الخطوة {currentStepIndex + 1} من {STEPS.length}</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Indicator */}
          <div className="flex justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isCompleted && "bg-green-500 text-white",
                      isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs text-center",
                    isActive && "font-medium",
                    !isActive && "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={currentStepIndex === 0 ? onClose : handleBack}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              {currentStepIndex === 0 ? 'إلغاء' : 'السابق'}
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading || (currentStep === 'test' && testStatus !== 'success')}
            >
              {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {currentStep === 'test' && testStatus === 'success' ? 'إكمال' : 'التالي'}
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
