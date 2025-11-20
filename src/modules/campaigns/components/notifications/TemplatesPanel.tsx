// ============================================================================
// Part 13.3: Notification Templates Panel
// ============================================================================

import { useState } from 'react';
import { Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { useNotificationTemplates } from '@/modules/campaigns/hooks/notifications/useNotificationTemplates';
import type { NotificationTemplate, NotificationTemplateFormData } from '@/modules/campaigns';

export function TemplatesPanel() {
  const { templates, loading, canManage, upsertTemplate, deleteTemplate, isLoading } =
    useNotificationTemplates();

  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<NotificationTemplateFormData>({
    key: '',
    subject: '',
    body: '',
    isActive: true,
  });

  const handleAdd = () => {
    setEditingTemplate(null);
    setFormData({ key: '', subject: '', body: '', isActive: true });
    setShowDialog(true);
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      key: template.key,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    await upsertTemplate({
      templateId: editingTemplate?.id || null,
      formData,
    });
    setShowDialog(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this template?')) {
      await deleteTemplate(id);
    }
  };

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>View-only access</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You don't have permission to manage notification templates.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>
                Manage message templates with placeholders like {'{'}
                {'{'}campaign_name{'}'}, {'{'}
                {'{'}employee_ref{'}'}
              </CardDescription>
            </div>
            <Button onClick={handleAdd} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!templates || templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No templates yet. Create your first one.</p>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-medium">{template.key}</span>
                      {template.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <Power className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <PowerOff className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1">{template.subject}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.body}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      disabled={isLoading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Use placeholders like {'{'}
              {'{'}campaign_name{'}'}, {'{'}
              {'{'}employee_ref{'}'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="key">Template Key *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="campaign_start"
                disabled={!!editingTemplate}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Welcome to {{campaign_name}}"
              />
            </div>
            <div>
              <Label htmlFor="body">Body *</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Hi {{employee_ref}}, you have been enrolled in {{campaign_name}}..."
                rows={6}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="is-active">Template is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isLoading || !formData.key || !formData.subject || !formData.body
              }
            >
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
