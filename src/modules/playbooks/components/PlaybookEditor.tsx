/**
 * M18 Part 2: Playbook Editor Component
 * Advanced editor for creating and modifying SOAR playbooks
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { PlaybookStepBuilder } from './PlaybookStepBuilder';
import { Save, Plus, Play, FileText } from 'lucide-react';

interface PlaybookEditorProps {
  playbookId?: string;
  onSave?: (playbook: any) => void;
  onExecute?: (playbookId: string) => void;
}

export function PlaybookEditor({ playbookId, onSave, onExecute }: PlaybookEditorProps) {
  const [playbookData, setPlaybookData] = useState({
    name: '',
    description_ar: '',
    description_en: '',
    execution_mode: 'manual',
    is_template: false,
    template_category: '',
    approval_required: false,
    approver_role: '',
    tags: [] as string[],
    estimated_duration_minutes: 30,
  });

  const [steps, setSteps] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('details');

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...playbookData,
        steps,
      });
    }
  };

  const handleExecute = () => {
    if (playbookId && onExecute) {
      onExecute(playbookId);
    }
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        id: `step-${Date.now()}`,
        step_order: steps.length + 1,
        step_name: `خطوة ${steps.length + 1}`,
        step_type: 'action',
        action_config: {},
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">محرر Playbook</h2>
          <p className="text-muted-foreground">إنشاء وتحرير سير عمل الأتمتة</p>
        </div>
        <div className="flex gap-2">
          {playbookId && (
            <Button onClick={handleExecute} variant="outline">
              <Play className="h-4 w-4 ml-2" />
              تنفيذ
            </Button>
          )}
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 ml-2" />
            حفظ
          </Button>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">التفاصيل</TabsTrigger>
          <TabsTrigger value="steps">
            الخطوات
            <Badge variant="secondary" className="mr-2">
              {steps.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معلومات Playbook</CardTitle>
              <CardDescription>المعلومات الأساسية للـ Playbook</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={playbookData.name}
                  onChange={(e) => setPlaybookData({ ...playbookData, name: e.target.value })}
                  placeholder="اسم Playbook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_ar">الوصف (عربي)</Label>
                <Textarea
                  id="description_ar"
                  value={playbookData.description_ar}
                  onChange={(e) => setPlaybookData({ ...playbookData, description_ar: e.target.value })}
                  placeholder="وصف Playbook بالعربية"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="execution_mode">وضع التنفيذ</Label>
                  <Select
                    value={playbookData.execution_mode}
                    onValueChange={(value) =>
                      setPlaybookData({ ...playbookData, execution_mode: value })
                    }
                  >
                    <SelectTrigger id="execution_mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">يدوي</SelectItem>
                      <SelectItem value="automatic">تلقائي</SelectItem>
                      <SelectItem value="semi-automatic">شبه تلقائي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">المدة المتوقعة (دقائق)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={playbookData.estimated_duration_minutes}
                    onChange={(e) =>
                      setPlaybookData({
                        ...playbookData,
                        estimated_duration_minutes: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>قالب Playbook</Label>
                  <p className="text-sm text-muted-foreground">
                    حفظ كقالب لإعادة الاستخدام
                  </p>
                </div>
                <Switch
                  checked={playbookData.is_template}
                  onCheckedChange={(checked) =>
                    setPlaybookData({ ...playbookData, is_template: checked })
                  }
                />
              </div>

              {playbookData.is_template && (
                <div className="space-y-2">
                  <Label htmlFor="template_category">فئة القالب</Label>
                  <Input
                    id="template_category"
                    value={playbookData.template_category}
                    onChange={(e) =>
                      setPlaybookData({ ...playbookData, template_category: e.target.value })
                    }
                    placeholder="مثال: حوادث أمنية"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Steps Tab */}
        <TabsContent value="steps" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>خطوات Playbook</CardTitle>
                  <CardDescription>تحديد خطوات سير العمل</CardDescription>
                </div>
                <Button onClick={addStep} size="sm">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة خطوة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PlaybookStepBuilder steps={steps} onStepsChange={setSteps} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات متقدمة</CardTitle>
              <CardDescription>تكوين خيارات Playbook</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>يتطلب موافقة</Label>
                  <p className="text-sm text-muted-foreground">
                    يجب الموافقة قبل التنفيذ
                  </p>
                </div>
                <Switch
                  checked={playbookData.approval_required}
                  onCheckedChange={(checked) =>
                    setPlaybookData({ ...playbookData, approval_required: checked })
                  }
                />
              </div>

              {playbookData.approval_required && (
                <div className="space-y-2">
                  <Label htmlFor="approver_role">دور الموافق</Label>
                  <Input
                    id="approver_role"
                    value={playbookData.approver_role}
                    onChange={(e) =>
                      setPlaybookData({ ...playbookData, approver_role: e.target.value })
                    }
                    placeholder="مثال: security_manager"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tags">الوسوم</Label>
                <Input
                  id="tags"
                  placeholder="أضف وسوم مفصولة بفواصل"
                  onBlur={(e) => {
                    const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                    setPlaybookData({ ...playbookData, tags });
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {playbookData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
