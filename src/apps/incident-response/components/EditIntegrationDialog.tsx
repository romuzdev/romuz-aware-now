/**
 * Edit Integration Dialog - Complete Form
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUpdateIntegration } from '../hooks/useIntegrations';
import type { IncidentIntegration } from '@/integrations/external';
import { z } from 'zod';

const updateSchema = z.object({
  integration_name: z.string().min(3).max(100).optional(),
  base_url: z.string().url().optional().or(z.literal('')),
  api_token: z.string().optional(),
  search_query: z.string().optional(),
});

interface Props {
  integration: IncidentIntegration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditIntegrationDialog({ integration, open, onOpenChange }: Props) {
  const updateMutation = useUpdateIntegration();
  
  const [formData, setFormData] = useState({
    integration_name: integration.integration_name,
    base_url: integration.config_json?.base_url || '',
    api_token: '',
    search_query: integration.config_json?.search_query || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (integration) {
      setFormData({
        integration_name: integration.integration_name,
        base_url: integration.config_json?.base_url || '',
        api_token: '',
        search_query: integration.config_json?.search_query || '',
      });
    }
  }, [integration]);

  if (!open) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      const validated = updateSchema.parse(formData);

      const config_json = { ...integration.config_json };
      if (validated.base_url) config_json.base_url = validated.base_url;
      if (validated.api_token) config_json.api_token = validated.api_token;
      if (validated.search_query) config_json.search_query = validated.search_query;

      await updateMutation.mutateAsync({
        id: integration.id,
        input: {
          integration_name: validated.integration_name,
          config_json,
        },
      });

      onOpenChange(false);
      
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

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">تعديل التكامل</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {integration.integration_name} • {integration.provider}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-muted rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              اسم التكامل
            </label>
            <input
              type="text"
              value={formData.integration_name}
              onChange={(e) => handleChange('integration_name', e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
            {errors.integration_name && (
              <p className="text-red-500 text-sm mt-1">{errors.integration_name}</p>
            )}
          </div>

          {integration.integration_type === 'siem' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  رابط API
                </label>
                <input
                  type="url"
                  value={formData.base_url}
                  onChange={(e) => handleChange('base_url', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
                {errors.base_url && (
                  <p className="text-red-500 text-sm mt-1">{errors.base_url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  API Token الجديد (اختياري)
                </label>
                <input
                  type="password"
                  value={formData.api_token}
                  onChange={(e) => handleChange('api_token', e.target.value)}
                  placeholder="اتركه فارغاً للاحتفاظ بالمفتاح الحالي"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  املأ هذا الحقل فقط إذا كنت تريد تغيير المفتاح
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  استعلام البحث
                </label>
                <input
                  type="text"
                  value={formData.search_query}
                  onChange={(e) => handleChange('search_query', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </>
          )}

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
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
