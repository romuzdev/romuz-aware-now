// ============================================================================
// Gate-E: Alert Templates Management Page
// ============================================================================

import { useState } from 'react';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { useAlertTemplates } from '@/features/observability/hooks/useAlertTemplates';
import { TemplateFormDialog } from '@/features/observability/components/TemplateFormDialog';
import { AlertTemplate } from '@/modules/observability';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { Skeleton } from '@/core/components/ui/skeleton';

export default function AlertTemplatesPage() {
  const { templates, loading, deleteTemplate } = useAlertTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AlertTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const handleEdit = (template: AlertTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">قوالب التنبيهات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة قوالب رسائل التنبيهات (Email Subject & Body)
          </p>
        </div>
        <Button onClick={() => { setEditingTemplate(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة قالب
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>القوالب المتاحة</CardTitle>
          <CardDescription>
            {templates.length} قالب مسجل
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد قوالب مسجلة. أضف أول قالب للبدء.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>اللغة</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المحتوى</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {template.code}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {template.locale === 'ar' ? 'العربية' : 'English'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {template.subject_tpl}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground text-sm">
                      {template.body_tpl}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا القالب؟ قد يؤثر ذلك على السياسات المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
