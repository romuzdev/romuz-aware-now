import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStepsProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, label: 'اختيار المؤسسة' },
  { number: 2, label: 'إكمال البيانات' },
  { number: 3, label: 'دخول النظام' },
];

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  step.number < currentStep && "bg-primary text-primary-foreground",
                  step.number === currentStep && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  step.number > currentStep && "bg-muted text-muted-foreground"
                )}
              >
                {step.number < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <p
                className={cn(
                  "text-xs mt-2 text-center whitespace-nowrap transition-colors",
                  step.number <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-2 -mt-6">
                <div
                  className={cn(
                    "h-full transition-colors",
                    step.number < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
