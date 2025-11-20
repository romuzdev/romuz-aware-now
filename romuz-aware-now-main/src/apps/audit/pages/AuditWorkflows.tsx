/**
 * Audit Workflows Page
 * M12: Manage audit workflow stages and assignments with advanced builder
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/core/components/ui/dialog';
import { useAuditWorkflows, useAudits, useCreateAuditWorkflow, type AuditWorkflowFilters } from '@/modules/grc';
import { AuditWorkflowManager, AuditWorkflowBuilder } from '@/modules/grc/components/audit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';

export default function AuditWorkflows() {
  const [filters, setFilters] = useState<AuditWorkflowFilters>({});
  const [selectedAuditId, setSelectedAuditId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkflowType, setSelectedWorkflowType] = useState<'planning' | 'execution' | 'reporting' | 'followup'>('planning');
  
  const { data: workflows, isLoading: workflowsLoading } = useAuditWorkflows(filters);
  const { data: audits, isLoading: auditsLoading } = useAudits({ sortBy: 'created_at', sortDir: 'desc' });
  const createWorkflowMutation = useCreateAuditWorkflow();

  // Get workflow for selected audit
  const selectedWorkflow = workflows?.find(w => w.audit_id === selectedAuditId);

  const handleCreateWorkflow = async () => {
    if (!selectedAuditId) return;
    
    try {
      await createWorkflowMutation.mutateAsync({
        audit_id: selectedAuditId,
        workflow_type: selectedWorkflowType,
        current_stage: 'planning',
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">سير عمل التدقيق</h1>
        <p className="text-muted-foreground">
          إدارة مراحل سير العمل والتعيينات لعمليات التدقيق
        </p>
      </div>

      {/* Audit Selection */}
      {auditsLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : audits && audits.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>اختر عملية تدقيق</CardTitle>
            <CardDescription>
              عرض وإدارة سير عمل التدقيق
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select 
                onValueChange={setSelectedAuditId}
                value={selectedAuditId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر عملية تدقيق" />
                </SelectTrigger>
                <SelectContent>
                  {audits.map((audit) => (
                    <SelectItem key={audit.id} value={audit.id}>
                      {audit.audit_code} - {audit.audit_title_ar || audit.audit_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAuditId && selectedWorkflow && (
                <Tabs defaultValue="builder" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="builder">بناء سير العمل</TabsTrigger>
                    <TabsTrigger value="manager">إدارة التنفيذ</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="builder" className="mt-6">
                    <AuditWorkflowBuilder 
                      workflowId={selectedWorkflow.id} 
                      workflowType={selectedWorkflow.workflow_type as any}
                    />
                  </TabsContent>
                  
                  <TabsContent value="manager" className="mt-6">
                    <AuditWorkflowManager auditId={selectedAuditId} />
                  </TabsContent>
                </Tabs>
              )}

              {selectedAuditId && !selectedWorkflow && (
                <Card>
                  <CardContent className="p-6 text-center space-y-4">
                    <p className="text-muted-foreground">لا يوجد سير عمل لهذا التدقيق</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      قم بإنشاء سير عمل جديد للبدء
                    </p>
                    
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="ml-2 h-4 w-4" />
                          إنشاء سير عمل
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>إنشاء سير عمل جديد</DialogTitle>
                          <DialogDescription>
                            اختر نوع سير العمل المناسب لعملية التدقيق
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">نوع سير العمل</label>
                            <Select 
                              value={selectedWorkflowType}
                              onValueChange={(value: any) => setSelectedWorkflowType(value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planning">التخطيط</SelectItem>
                                <SelectItem value="execution">التنفيذ</SelectItem>
                                <SelectItem value="reporting">إعداد التقارير</SelectItem>
                                <SelectItem value="followup">المتابعة</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setDialogOpen(false)}
                          >
                            إلغاء
                          </Button>
                          <Button 
                            onClick={handleCreateWorkflow}
                            disabled={createWorkflowMutation.isPending}
                          >
                            {createWorkflowMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">لا توجد عمليات تدقيق متاحة</p>
            <p className="text-sm text-muted-foreground">
              قم بإنشاء عملية تدقيق أولاً من صفحة خطط التدقيق
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
