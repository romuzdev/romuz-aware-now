/**
 * M14 Enhancement - Custom KPI Formula Builder
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/core/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Plus, Save, Trash2, Calculator, Info } from 'lucide-react';
import { useCustomKPIFormulas, useCreateCustomKPIFormula, useDeleteCustomKPIFormula } from '../hooks/useCustomKPIFormulas';
import { FormulaEditor } from './FormulaEditor';
import { FormulaVariablesPanel } from './FormulaVariablesPanel';
import { validateFormula, previewFormula, FORMULA_EXAMPLES } from '../utils/formula-evaluator';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Alert, AlertDescription } from '@/core/components/ui/alert';

export function CustomKPIFormulaBuilder() {
  const { data: formulas, isLoading } = useCustomKPIFormulas(false);
  const createMutation = useCreateCustomKPIFormula();
  const deleteMutation = useDeleteCustomKPIFormula();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    kpi_name: '',
    kpi_name_ar: '',
    description: '',
    formula: '',
    unit: '',
    target_value: '',
    category: 'custom'
  });
  const [sampleValues, setSampleValues] = useState<Record<string, number>>({});

  const handleFormulaChange = (newFormula: string) => {
    setFormData(prev => ({ ...prev, formula: newFormula }));
  };

  const handleVariableInsert = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      formula: prev.formula + `{${variable}}`
    }));
  };

  const handleExampleSelect = (example: typeof FORMULA_EXAMPLES[0]) => {
    setFormData(prev => ({
      ...prev,
      formula: example.formula,
      kpi_name: example.name,
      description: example.description
    }));
  };

  const handleSubmit = () => {
    const validation = validateFormula(formData.formula);
    if (!validation.isValid) {
      return;
    }

    createMutation.mutate({
      kpi_name: formData.kpi_name,
      kpi_name_ar: formData.kpi_name_ar || undefined,
      description: formData.description || undefined,
      formula: formData.formula,
      variables: {}, // Will be extracted from formula server-side
      unit: formData.unit || undefined,
      target_value: formData.target_value ? parseFloat(formData.target_value) : undefined,
      category: formData.category || undefined
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          kpi_name: '',
          kpi_name_ar: '',
          description: '',
          formula: '',
          unit: '',
          target_value: '',
          category: 'custom'
        });
      }
    });
  };

  const handleDelete = (formulaId: string) => {
    if (confirm('هل تريد حذف هذا المؤشر المخصص؟')) {
      deleteMutation.mutate(formulaId);
    }
  };

  const validation = validateFormula(formData.formula);
  const preview = formData.formula ? previewFormula(formData.formula, sampleValues) : { result: null };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">المؤشرات المخصصة</h2>
          <p className="text-muted-foreground">أنشئ مؤشرات أداء مخصصة باستخدام الصيغ الرياضية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء مؤشر جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء مؤشر مخصص</DialogTitle>
              <DialogDescription>
                قم بإنشاء مؤشر أداء مخصص باستخدام صيغة رياضية
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formula Editor - 2 columns */}
              <div className="lg:col-span-2 space-y-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label>اسم المؤشر *</Label>
                    <Input
                      value={formData.kpi_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, kpi_name: e.target.value }))}
                      placeholder="مثال: معدل المخاطر العالية"
                    />
                  </div>
                  <div>
                    <Label>اسم المؤشر (عربي)</Label>
                    <Input
                      value={formData.kpi_name_ar}
                      onChange={(e) => setFormData(prev => ({ ...prev, kpi_name_ar: e.target.value }))}
                      placeholder="اختياري"
                    />
                  </div>
                  <div>
                    <Label>الوصف</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="وصف المؤشر وكيفية حسابه"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Formula Editor */}
                <div>
                  <Label>الصيغة الرياضية *</Label>
                  <FormulaEditor
                    value={formData.formula}
                    onChange={handleFormulaChange}
                    validation={validation}
                  />
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>الوحدة</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="%"
                    />
                  </div>
                  <div>
                    <Label>القيمة المستهدفة</Label>
                    <Input
                      type="number"
                      value={formData.target_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label>الفئة</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">مخصص</SelectItem>
                        <SelectItem value="risk">المخاطر</SelectItem>
                        <SelectItem value="compliance">الامتثال</SelectItem>
                        <SelectItem value="campaign">الحملات</SelectItem>
                        <SelectItem value="audit">التدقيق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview */}
                {preview.result !== null && (
                  <Alert>
                    <Calculator className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-semibold">النتيجة التقديرية: </span>
                      <span className="text-2xl font-bold text-primary">{preview.result}</span>
                      {formData.unit && <span className="mr-1">{formData.unit}</span>}
                    </AlertDescription>
                  </Alert>
                )}
                {preview.error && (
                  <Alert variant="destructive">
                    <AlertDescription>{preview.error}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Variables Panel - 1 column */}
              <div className="lg:col-span-1">
                <FormulaVariablesPanel
                  onVariableInsert={handleVariableInsert}
                  onExampleSelect={handleExampleSelect}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!validation.isValid || !formData.kpi_name || createMutation.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                حفظ المؤشر
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Formulas List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formulas && formulas.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                لا توجد مؤشرات مخصصة. ابدأ بإنشاء مؤشر جديد!
              </p>
            </CardContent>
          </Card>
        )}
        {formulas?.map((formula) => (
          <Card key={formula.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{formula.kpi_name_ar || formula.kpi_name}</span>
                <Badge variant={formula.is_active ? 'default' : 'secondary'}>
                  {formula.is_active ? 'نشط' : 'معطل'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formula.description && (
                <p className="text-sm text-muted-foreground">{formula.description}</p>
              )}
              <div className="bg-muted p-3 rounded text-sm font-mono">
                {formula.formula}
              </div>
              <div className="flex items-center justify-between text-sm">
                {formula.target_value && (
                  <span className="text-muted-foreground">
                    الهدف: {formula.target_value} {formula.unit}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(formula.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
