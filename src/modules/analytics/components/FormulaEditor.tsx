/**
 * M14 Enhancement - Formula Editor Component
 */

import { Textarea } from '@/core/components/ui/textarea';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormulaEditorProps {
  value: string;
  onChange: (value: string) => void;
  validation: {
    isValid: boolean;
    error?: string;
  };
  placeholder?: string;
}

export function FormulaEditor({
  value,
  onChange,
  validation,
  placeholder = 'مثال: ({high_risk_count} / {risk_count}) * 100'
}: FormulaEditorProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'font-mono text-sm min-h-[120px]',
            validation.isValid && value ? 'border-success' : '',
            !validation.isValid && value ? 'border-destructive' : ''
          )}
          dir="ltr"
        />
        {value && (
          <div className="absolute top-2 left-2">
            {validation.isValid ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
          </div>
        )}
      </div>

      {/* Validation Message */}
      {value && !validation.isValid && validation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validation.error}</AlertDescription>
        </Alert>
      )}

      {value && validation.isValid && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>الصيغة صحيحة ✓</AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 نصائح:</p>
        <ul className="list-disc list-inside mr-4 space-y-1">
          <li>استخدم الأقواس () لتحديد الأولويات</li>
          <li>المتغيرات تكون بين {'{ }'} مثل: {'{risk_count}'}</li>
          <li>العمليات المتاحة: + - * / ()</li>
          <li>مثال: ({'{high_risk_count}'} / {'{risk_count}'}) * 100</li>
        </ul>
      </div>
    </div>
  );
}
