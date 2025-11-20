/**
 * Audit Workflow Builder Component
 * M12: Advanced workflow builder with drag-drop stage management
 */

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Badge } from '@/core/components/ui/badge';
import { Switch } from '@/core/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Separator } from '@/core/components/ui/separator';
import {  
  GripVertical, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import type { 
  CreateStageInput, 
  RequiredAction, 
  StageTemplate
} from '../../types/audit-workflow-stages.types';
import { STAGE_TEMPLATES } from '../../types/audit-workflow-stages.types';

interface WorkflowStage extends CreateStageInput {
  id: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

interface AuditWorkflowBuilderProps {
  workflowId: string;
  workflowType: keyof typeof STAGE_TEMPLATES;
  existingStages?: WorkflowStage[];
  onSave?: (stages: WorkflowStage[]) => Promise<void>;
}

export function AuditWorkflowBuilder({
  workflowId,
  workflowType,
  existingStages = [],
  onSave
}: AuditWorkflowBuilderProps) {
  const [stages, setStages] = useState<WorkflowStage[]>(existingStages);
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load templates
  const loadTemplates = () => {
    const templates = (STAGE_TEMPLATES as any)[workflowType] as StageTemplate[];
    const newStages: WorkflowStage[] = templates.map((template, index) => ({
      id: `temp-${Date.now()}-${index}`,
      workflow_id: workflowId,
      stage_name: template.stage_name,
      stage_name_ar: template.stage_name_ar,
      sequence_order: template.sequence_order,
      required_actions: template.default_actions.map((action, idx) => ({
        id: `action-${idx}`,
        title: action.title,
        title_ar: action.title_ar,
        description: action.description,
        completed: false
      })),
      approval_required: template.approval_required,
      approver_role: template.approver_role
    }));
    
    setStages(newStages);
    toast.success('تم تحميل القوالب الافتراضية');
  };

  // Add new stage
  const addStage = () => {
    const newStage: WorkflowStage = {
      id: `temp-${Date.now()}`,
      workflow_id: workflowId,
      stage_name: 'مرحلة جديدة',
      stage_name_ar: 'مرحلة جديدة',
      sequence_order: stages.length + 1,
      required_actions: [],
      approval_required: false
    };
    setStages([...stages, newStage]);
  };

  // Remove stage
  const removeStage = (stageId: string) => {
    setStages(stages.filter(s => s.id !== stageId));
    toast.success('تم حذف المرحلة');
  };

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence orders
    const updatedStages = items.map((stage, index) => ({
      ...stage,
      sequence_order: index + 1
    }));

    setStages(updatedStages);
  };

  // Save workflow
  const handleSave = async () => {
    if (stages.length === 0) {
      toast.error('يجب إضافة مرحلة واحدة على الأقل');
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(stages);
      toast.success('تم حفظ سير العمل بنجاح');
    } catch (error) {
      toast.error('فشل حفظ سير العمل');
    } finally {
      setIsSaving(false);
    }
  };

  // Add action to stage
  const addAction = (stageId: string) => {
    setStages(stages.map(stage => {
      if (stage.id === stageId) {
        const newAction: RequiredAction = {
          id: `action-${Date.now()}`,
          title: 'إجراء جديد',
          completed: false
        };
        return {
          ...stage,
          required_actions: [...(stage.required_actions || []), newAction]
        };
      }
      return stage;
    }));
  };

  // Remove action from stage
  const removeAction = (stageId: string, actionId: string) => {
    setStages(stages.map(stage => {
      if (stage.id === stageId) {
        return {
          ...stage,
          required_actions: (stage.required_actions || []).filter(a => a.id !== actionId)
        };
      }
      return stage;
    }));
  };

  // Update stage field
  const updateStage = (stageId: string, field: keyof WorkflowStage, value: any) => {
    setStages(stages.map(stage => 
      stage.id === stageId ? { ...stage, [field]: value } : stage
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">بناء سير عمل التدقيق</h2>
          <p className="text-sm text-muted-foreground">
            قم بإنشاء وتخصيص مراحل سير العمل
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTemplates}>
            <RotateCcw className="mr-2 h-4 w-4" />
            تحميل القوالب
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'جارِ الحفظ...' : 'حفظ سير العمل'}
          </Button>
        </div>
      </div>

      {/* Stages List */}
      <Card>
        <CardHeader>
          <CardTitle>المراحل ({stages.length})</CardTitle>
          <CardDescription>
            اسحب وأفلت لإعادة ترتيب المراحل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="stages">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {stages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Circle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm">لا توجد مراحل. قم بإضافة مرحلة أو تحميل القوالب</p>
                    </div>
                  ) : (
                    stages.map((stage, index) => (
                      <Draggable key={stage.id} draggableId={stage.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={snapshot.isDragging ? 'shadow-lg' : ''}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                {/* Drag Handle */}
                                <div {...provided.dragHandleProps} className="mt-2">
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>

                                {/* Stage Number */}
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm mt-1">
                                  {index + 1}
                                </div>

                                {/* Stage Content */}
                                <div className="flex-1 space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>اسم المرحلة (عربي)</Label>
                                      <Input
                                        value={stage.stage_name_ar || ''}
                                        onChange={(e) => updateStage(stage.id, 'stage_name_ar', e.target.value)}
                                        placeholder="مثال: تحديد النطاق"
                                      />
                                    </div>
                                    <div>
                                      <Label>Stage Name (English)</Label>
                                      <Input
                                        value={stage.stage_name}
                                        onChange={(e) => updateStage(stage.id, 'stage_name', e.target.value)}
                                        placeholder="Example: Scope Definition"
                                      />
                                    </div>
                                  </div>

                                  {/* Required Actions */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label>الإجراءات المطلوبة</Label>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addAction(stage.id)}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        إضافة إجراء
                                      </Button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {(stage.required_actions || []).map((action) => (
                                        <div key={action.id} className="flex items-center gap-2 p-2 border rounded-lg">
                                          <CheckCircle2 className={`h-4 w-4 ${action.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                                          <Input
                                            value={action.title_ar || action.title}
                                            onChange={(e) => {
                                              setStages(stages.map(s => {
                                                if (s.id === stage.id) {
                                                  return {
                                                    ...s,
                                                    required_actions: (s.required_actions || []).map(a =>
                                                      a.id === action.id ? { ...a, title_ar: e.target.value } : a
                                                    )
                                                  };
                                                }
                                                return s;
                                              }));
                                            }}
                                            className="flex-1"
                                            placeholder="عنوان الإجراء"
                                          />
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeAction(stage.id, action.id)}
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Approval Settings */}
                                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={stage.approval_required || false}
                                        onCheckedChange={(checked) => updateStage(stage.id, 'approval_required', checked)}
                                      />
                                      <Label>يتطلب موافقة</Label>
                                    </div>
                                    
                                    {stage.approval_required && (
                                      <div className="flex items-center gap-2">
                                        <Label>الدور المسؤول:</Label>
                                        <Select
                                          value={stage.approver_role || ''}
                                          onValueChange={(value) => updateStage(stage.id, 'approver_role', value)}
                                        >
                                          <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="اختر الدور" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="audit_manager">مدير التدقيق</SelectItem>
                                            <SelectItem value="audit_director">مدير إدارة التدقيق</SelectItem>
                                            <SelectItem value="audit_committee">لجنة التدقيق</SelectItem>
                                            <SelectItem value="management">الإدارة العليا</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>

                                  {/* Notes */}
                                  <div>
                                    <Label>ملاحظات</Label>
                                    <Textarea
                                      value={stage.notes || ''}
                                      onChange={(e) => updateStage(stage.id, 'notes', e.target.value)}
                                      placeholder="ملاحظات إضافية عن هذه المرحلة..."
                                      rows={2}
                                    />
                                  </div>
                                </div>

                                {/* Actions */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeStage(stage.id)}
                                  className="mt-1"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <Separator className="my-4" />

          <Button onClick={addStage} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            إضافة مرحلة جديدة
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص سير العمل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{stages.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي المراحل</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {stages.filter(s => s.approval_required).length}
              </div>
              <div className="text-sm text-muted-foreground">تتطلب موافقة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stages.reduce((sum, s) => sum + (s.required_actions?.length || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي الإجراءات</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
