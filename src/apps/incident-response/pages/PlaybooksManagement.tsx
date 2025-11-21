/**
 * M18 Part 2: Playbooks Management Page
 * Comprehensive playbook management with editor and execution monitoring
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import { 
  PlaybookEditor, 
  PlaybookExecutionMonitor, 
  PlaybookTemplateLibrary 
} from '@/modules/playbooks/components';
import { usePlaybookManagement, usePlaybookExecution } from '@/modules/playbooks/hooks';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { Plus, Play, Edit, Trash2, FileText, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function PlaybooksManagement() {
  const { tenantId, user } = useAppContext();
  const { playbooks, playbooksLoading, createPlaybook, deletePlaybook } = usePlaybookManagement();
  const [activeTab, setActiveTab] = useState('list');
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);
  const [executingPlaybookId, setExecutingPlaybookId] = useState<string | null>(null);

  const handleCreatePlaybook = async (playbookData: any) => {
    try {
      await createPlaybook({
        tenant_id: tenantId!,
        created_by: user?.id!,
        ...playbookData,
      });
      setActiveTab('list');
    } catch (error: any) {
      toast({
        title: 'خطأ في إنشاء Playbook',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExecutePlaybook = async (playbookId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('execute-playbook', {
        body: { playbookId },
      });

      if (error) throw error;

      setExecutingPlaybookId(data.execution_id);
      setActiveTab('monitor');
      
      toast({
        title: 'تم بدء التنفيذ',
        description: 'جاري تنفيذ Playbook',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في التنفيذ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlaybook = async (playbookId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا Playbook؟')) return;

    try {
      await deletePlaybook(playbookId);
    } catch (error: any) {
      toast({
        title: 'خطأ في الحذف',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedPlaybookId(template.id);
    setActiveTab('editor');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة Playbooks</h1>
          <p className="text-muted-foreground">
            إنشاء وإدارة سير عمل الأتمتة للاستجابة للحوادث
          </p>
        </div>
        <Button onClick={() => setActiveTab('editor')}>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء Playbook جديد
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">
            <FileText className="h-4 w-4 ml-2" />
            القائمة
            <Badge variant="secondary" className="mr-2">
              {playbooks?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="editor">
            <Edit className="h-4 w-4 ml-2" />
            المحرر
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 ml-2" />
            القوالب
          </TabsTrigger>
          <TabsTrigger value="monitor">
            <TrendingUp className="h-4 w-4 ml-2" />
            المراقبة
          </TabsTrigger>
        </TabsList>

        {/* Playbooks List Tab */}
        <TabsContent value="list" className="space-y-4">
          {playbooksLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">جاري التحميل...</p>
              </CardContent>
            </Card>
          ) : playbooks && playbooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playbooks.map((playbook) => (
                <Card key={playbook.id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {playbook.description_ar || playbook.description_en || 'Playbook'}
                      </CardTitle>
                      {playbook.is_template && (
                        <Badge variant="secondary">قالب</Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {playbook.description_ar || playbook.description_en}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {playbook.execution_mode === 'automatic' ? 'تلقائي' : 'يدوي'}
                      </Badge>
                      <Badge variant="outline">
                        {playbook.estimated_duration_minutes || 30} دقيقة
                      </Badge>
                    </div>

                    {playbook.success_rate_pct !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground">معدل النجاح</p>
                        <p className="text-2xl font-bold">
                          {playbook.success_rate_pct.toFixed(0)}%
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleExecutePlaybook(playbook.id)}
                        className="flex-1"
                        size="sm"
                      >
                        <Play className="h-4 w-4 ml-2" />
                        تنفيذ
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedPlaybookId(playbook.id);
                          setActiveTab('editor');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeletePlaybook(playbook.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد Playbooks بعد</p>
                <Button onClick={() => setActiveTab('editor')} className="mt-4">
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء أول Playbook
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Editor Tab */}
        <TabsContent value="editor">
          <PlaybookEditor
            playbookId={selectedPlaybookId || undefined}
            onSave={handleCreatePlaybook}
            onExecute={handleExecutePlaybook}
          />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <PlaybookTemplateLibrary onSelectTemplate={handleSelectTemplate} />
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor">
          {executingPlaybookId ? (
            <PlaybookExecutionMonitor executionId={executingPlaybookId} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا يوجد تنفيذ نشط</p>
                <p className="text-sm text-muted-foreground mt-2">
                  قم بتنفيذ Playbook لمراقبة التقدم
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
