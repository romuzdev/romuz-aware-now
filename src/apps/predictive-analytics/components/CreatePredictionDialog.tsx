/**
 * Create Prediction Dialog Component
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Label } from '@/core/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Textarea } from '@/core/components/ui/textarea';
import { useCreatePrediction } from '@/modules/analytics/hooks/usePredictiveAnalytics';
import { Loader2 } from 'lucide-react';
import type { PredictionType } from '@/modules/analytics/types/predictive-analytics.types';

interface CreatePredictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PREDICTION_TYPES: { value: PredictionType; label: string; labelAr: string }[] = [
  { value: 'risk', label: 'Risk Assessment', labelAr: 'تقييم المخاطر' },
  { value: 'incident', label: 'Incident Forecast', labelAr: 'توقع الحوادث' },
  { value: 'compliance', label: 'Compliance Score', labelAr: 'درجة الامتثال' },
  { value: 'campaign', label: 'Campaign Success', labelAr: 'نجاح الحملة' },
  { value: 'audit', label: 'Audit Outcome', labelAr: 'نتيجة التدقيق' },
  { value: 'breach', label: 'Breach Likelihood', labelAr: 'احتمالية الاختراق' },
];

export function CreatePredictionDialog({ open, onOpenChange }: CreatePredictionDialogProps) {
  const { t, i18n } = useTranslation();
  const [modelType, setModelType] = useState<PredictionType>('risk');
  const [notes, setNotes] = useState('');
  const createPrediction = useCreatePrediction();

  const handleSubmit = () => {
    // Generate sample input features based on type
    const inputFeatures = generateSampleFeatures(modelType);
    
    createPrediction.mutate(
      {
        model_type: modelType,
        input_features: inputFeatures,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setNotes('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('Create New Prediction', 'إنشاء تنبؤ جديد')}</DialogTitle>
          <DialogDescription>
            {t('Select a model type to generate an AI-powered prediction', 'اختر نوع النموذج لإنشاء تنبؤ بالذكاء الاصطناعي')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Prediction Type', 'نوع التنبؤ')}</Label>
            <Select value={modelType} onValueChange={(v) => setModelType(v as PredictionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PREDICTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {i18n.language === 'ar' ? type.labelAr : type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('Notes (Optional)', 'ملاحظات (اختياري)')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('Add any additional context...', 'أضف أي سياق إضافي...')}
              rows={3}
            />
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            {t(
              'The AI will analyze current data and generate a prediction with confidence scores.',
              'سيقوم الذكاء الاصطناعي بتحليل البيانات الحالية وإنشاء تنبؤ مع درجات الثقة.'
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createPrediction.isPending}
          >
            {t('Cancel', 'إلغاء')}
          </Button>
          <Button onClick={handleSubmit} disabled={createPrediction.isPending}>
            {createPrediction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('Generate Prediction', 'إنشاء التنبؤ')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateSampleFeatures(type: PredictionType): Record<string, any> {
  const features: Record<PredictionType, Record<string, any>> = {
    risk: {
      threat_level: Math.floor(Math.random() * 5) + 1,
      vulnerability_count: Math.floor(Math.random() * 20),
      control_effectiveness: Math.random() * 100,
      recent_incidents: Math.floor(Math.random() * 10),
    },
    incident: {
      historical_incidents: Math.floor(Math.random() * 50),
      threat_intelligence_score: Math.random() * 100,
      security_posture: Math.random() * 100,
      time_period: '30_days',
    },
    compliance: {
      controls_implemented: Math.floor(Math.random() * 100),
      controls_total: 150,
      last_audit_score: 60 + Math.random() * 35,
      policy_adherence: Math.random() * 100,
    },
    campaign: {
      target_audience_size: 100 + Math.floor(Math.random() * 500),
      content_quality_score: 60 + Math.random() * 40,
      timing_score: Math.random() * 100,
      previous_campaigns_avg: 50 + Math.random() * 40,
    },
    audit: {
      control_maturity: Math.random() * 100,
      historical_findings: Math.floor(Math.random() * 30),
      remediation_rate: Math.random() * 100,
      documentation_quality: 60 + Math.random() * 40,
    },
    breach: {
      security_score: Math.random() * 100,
      vulnerabilities: Math.floor(Math.random() * 50),
      threat_exposure: Math.random() * 100,
      incident_history: Math.floor(Math.random() * 20),
    },
  };
  return features[type];
}
