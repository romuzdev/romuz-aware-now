/**
 * Control Mapping Suggestions Component
 * AI-powered control mapping recommendations
 */

import { useState } from 'react';
import { Link as LinkIcon, Sparkles, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Label } from '@/core/components/ui/label';
import { 
  useControlMappingSuggestions, 
  useApplyControlMapping 
} from '@/modules/grc';

interface ControlMappingSuggestionsProps {
  requirementId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ControlMappingSuggestions({
  requirementId,
  open,
  onClose,
  onSuccess,
}: ControlMappingSuggestionsProps) {
  const [selectedControlId, setSelectedControlId] = useState<string>('');
  const [mappingType, setMappingType] = useState<'primary' | 'supporting'>('primary');

  const { data: suggestions, isLoading } = useControlMappingSuggestions(requirementId);
  const applyMapping = useApplyControlMapping();

  const handleApply = async () => {
    if (!selectedControlId) return;

    await applyMapping.mutateAsync({
      requirementId,
      controlId: selectedControlId,
      mappingType,
    });

    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            اقتراحات ربط الضوابط
          </DialogTitle>
          <DialogDescription>
            اقتراحات تلقائية للضوابط المناسبة لهذا المتطلب بناءً على الذكاء الاصطناعي
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">جاري البحث عن الضوابط المناسبة...</p>
          </div>
        ) : suggestions && suggestions.length > 0 ? (
          <div className="space-y-6">
            {/* Mapping Type Selection */}
            <div className="space-y-3">
              <Label>نوع الربط</Label>
              <RadioGroup value={mappingType} onValueChange={(v) => setMappingType(v as any)}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="primary" id="primary" />
                  <Label htmlFor="primary" className="cursor-pointer">
                    ضابط رئيسي
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="supporting" id="supporting" />
                  <Label htmlFor="supporting" className="cursor-pointer">
                    ضابط داعم
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Suggestions List */}
            <div className="space-y-3">
              <Label>الضوابط المقترحة ({suggestions.length})</Label>
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.control_id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedControlId === suggestion.control_id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50 hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedControlId(suggestion.control_id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{suggestion.control_code}</Badge>
                          {selectedControlId === suggestion.control_id && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <h4 className="font-medium">{suggestion.control_title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {suggestion.match_reason}
                        </p>
                      </div>
                      <div className="text-left space-y-1">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(suggestion.match_score * 100)}%
                        </div>
                        <Progress 
                          value={suggestion.match_score * 100} 
                          className="w-20 h-2"
                        />
                        <p className="text-xs text-muted-foreground">معدل التطابق</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button
                onClick={handleApply}
                disabled={!selectedControlId || applyMapping.isPending}
              >
                <LinkIcon className="ml-2 h-4 w-4" />
                {applyMapping.isPending ? 'جاري الربط...' : 'تطبيق الربط'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لا توجد اقتراحات متاحة لهذا المتطلب</p>
            <p className="text-sm text-muted-foreground mt-2">
              قد تحتاج إلى إنشاء ضوابط جديدة
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
