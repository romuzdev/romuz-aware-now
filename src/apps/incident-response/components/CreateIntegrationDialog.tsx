/**
 * Create Integration Dialog - Complete Form
 */

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useCreateIntegration } from '../hooks/useIntegrations';
import { z } from 'zod';

// Validation Schema
const integrationSchema = z.object({
  integration_name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل').max(100),
  integration_type: z.enum(['siem', 'webhook', 'cloud_provider', 'log_monitor', 'security_tool']),
  provider: z.string().min(2, 'اسم المزود مطلوب').max(50),
  auth_type: z.enum(['api_key', 'oauth', 'basic_auth', 'token', 'webhook_signature']).optional(),
  
  // Config fields
  base_url: z.string().url('الرجاء إدخال رابط صحيح').optional().or(z.literal('')),
  api_token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  search_query: z.string().optional(),
});

type IntegrationFormData = z.infer<typeof integrationSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateIntegrationDialog({ open, onOpenChange }: Props) {
  const createMutation = useCreateIntegration();
  
  const [formData, setFormData] = useState<Partial<IntegrationFormData>>({
    integration_type: 'siem',
    auth_type: 'api_key',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate form data
      const validated = integrationSchema.parse(formData);

      // Build config_json based on integration type
      const config_json: Record<string, any> = {};
      
      if (validated.base_url) config_json.base_url = validated.base_url;
      if (validated.api_token) config_json.api_token = validated.api_token;
      if (validated.username) config_json.username = validated.username;
      if (validated.password) config_json.password = validated.password;
      if (validated.search_query) config_json.search_query = validated.search_query;

      // Create integration
      await createMutation.mutateAsync({
        integration_name: validated.integration_name,
        integration_type: validated.integration_type,
        provider: validated.provider,
        config_json,
        auth_type: validated.auth_type,
      });

      // Close dialog on success
      onOpenChange(false);
      
      // Reset form
      setFormData({
        integration_type: 'siem',
        auth_type: 'api_key',
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const renderProviderFields = () => {
    const type = formData.integration_type;
    
    if (type === 'siem') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">
              المزود <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.provider || ''}
              onChange={(e) => handleChange('provider', e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="">اختر المزود</option>
              <option value="splunk">Splunk</option>
              <option value="qradar">IBM QRadar</option>
              <option value="arcsight">ArcSight ESM</option>
              <option value="logrhythm">LogRhythm</option>
              <option value="other">أخرى</option>
            </select>
            {errors.provider && (
              <p className="text-red-500 text-sm mt-1">{errors.provider}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              رابط API <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.base_url || ''}
              onChange={(e) => handleChange('base_url', e.target.value)}
              placeholder="https://splunk.company.com"
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
            {errors.base_url && (
              <p className="text-red-500 text-sm mt-1">{errors.base_url}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              API Token <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.api_token || ''}
              onChange={(e) => handleChange('api_token', e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">
              سيتم تشفير وتخزين المفتاح بأمان
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              استعلام البحث (اختياري)
            </label>
            <input
              type="text"
              value={formData.search_query || ''}
              onChange={(e) => handleChange('search_query', e.target.value)}
              placeholder="index=security severity>=3"
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </>
      );
    }

    if (type === 'cloud_provider') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">
              المزود <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.provider || ''}
              onChange={(e) => handleChange('provider', e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="">اختر المزود</option>
              <option value="aws_guardduty">AWS GuardDuty</option>
              <option value="aws_security_hub">AWS Security Hub</option>
              <option value="azure_security">Azure Security Center</option>
              <option value="gcp_security">GCP Security Command Center</option>
            </select>
            {errors.provider && (
              <p className="text-red-500 text-sm mt-1">{errors.provider}</p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">كيفية التكامل:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>انسخ Webhook URL من الأسفل</li>
                  <li>أضفه في إعدادات SNS/Event Grid</li>
                  <li>قم بتفعيل الإشعارات للأحداث الأمنية</li>
                </ol>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (type === 'webhook') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">
              اسم المصدر <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.provider || ''}
              onChange={(e) => handleChange('provider', e.target.value)}
              placeholder="مثال: Custom Firewall System"
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
            {errors.provider && (
              <p className="text-red-500 text-sm mt-1">{errors.provider}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              نوع المصادقة
            </label>
            <select
              value={formData.auth_type || 'webhook_signature'}
              onChange={(e) => handleChange('auth_type', e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="webhook_signature">Webhook Signature</option>
              <option value="api_key">API Key</option>
              <option value="token">Bearer Token</option>
            </select>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-md">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold mb-1">Webhook URL:</p>
                <p className="font-mono text-xs break-all">
                  سيتم إنشاء URL بعد حفظ التكامل
                </p>
              </div>
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">إنشاء تكامل جديد</h2>
            <p className="text-sm text-muted-foreground mt-1">
              اربط نظام الحوادث مع SIEM أو Cloud Provider أو Webhook
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-muted rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                اسم التكامل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.integration_name || ''}
                onChange={(e) => handleChange('integration_name', e.target.value)}
                placeholder="مثال: Splunk Production SIEM"
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              {errors.integration_name && (
                <p className="text-red-500 text-sm mt-1">{errors.integration_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                نوع التكامل <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.integration_type}
                onChange={(e) => handleChange('integration_type', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="siem">SIEM System</option>
                <option value="cloud_provider">Cloud Provider</option>
                <option value="webhook">Custom Webhook</option>
                <option value="log_monitor">Log Monitoring</option>
                <option value="security_tool">Security Tool</option>
              </select>
            </div>
          </div>

          {/* Provider-Specific Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">إعدادات الاتصال</h3>
            {renderProviderFields()}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border rounded-md hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ التكامل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
