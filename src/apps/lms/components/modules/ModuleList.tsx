import { useState } from 'react';
import { Plus, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { useCreateModule, useDeleteModule } from '@/apps/lms/hooks';
import type { CourseModule } from '@/integrations/supabase/lms';
import { ModuleDialog } from './ModuleDialog';

interface ModuleListProps {
  courseId: string;
  modules: CourseModule[];
}

export function ModuleList({ courseId, modules }: ModuleListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | undefined>();

  const createMutation = useCreateModule();
  const deleteMutation = useDeleteModule();

  const handleCreate = async (data: Omit<CourseModule, 'id' | 'created_at' | 'updated_at'>) => {
    await createMutation.mutateAsync(data);
    setDialogOpen(false);
  };

  const handleEdit = (module: CourseModule) => {
    setEditingModule(module);
    setDialogOpen(true);
  };

  const handleDelete = async (moduleId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الوحدة؟')) {
      await deleteMutation.mutateAsync(moduleId);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingModule(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">الوحدات التدريبية</h3>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة وحدة
        </Button>
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              لا توجد وحدات تدريبية بعد. ابدأ بإضافة الوحدة الأولى.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {modules.map((module, index) => (
            <Card key={module.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">الوحدة {index + 1}</Badge>
                        <CardTitle className="text-base">{module.title}</CardTitle>
                      </div>
                      {module.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(module)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(module.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <ModuleDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        courseId={courseId}
        module={editingModule}
        onSubmit={handleCreate}
      />
    </div>
  );
}
