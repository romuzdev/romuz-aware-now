import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Label } from '@/core/components/ui/label';
import type { Module, ModuleType, ModuleFormData } from '@/modules/campaigns';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ModuleFormData) => Promise<void>;
  module?: Module | null;
}

export function ModuleFormDialog({ open, onClose, onSubmit, module }: Props) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ModuleType>('article');
  const [urlOrRef, setUrlOrRef] = useState('');
  const [content, setContent] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setType(module.type);
      setUrlOrRef(module.urlOrRef || '');
      setContent(module.content || '');
      setIsRequired(module.isRequired);
      setEstimatedMinutes(module.estimatedMinutes ? module.estimatedMinutes.toString() : '');
    } else {
      setTitle('');
      setType('article');
      setUrlOrRef('');
      setContent('');
      setIsRequired(true);
      setEstimatedMinutes('');
    }
  }, [module, open]);

  async function handleSubmit() {
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        type,
        urlOrRef: urlOrRef.trim() || undefined,
        content: content.trim() || undefined,
        isRequired,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const needsUrl = type === 'video' || type === 'link' || type === 'file';
  const needsContent = type === 'article';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{module ? 'Edit Module' : 'New Module'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Module title" />
          </div>

          <div>
            <Label>Type *</Label>
            <Select value={type} onValueChange={(v: ModuleType) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="file">File</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsUrl && (
            <div>
              <Label>URL / Reference</Label>
              <Input
                value={urlOrRef}
                onChange={(e) => setUrlOrRef(e.target.value)}
                placeholder={type === 'file' ? 'File path or storage URL' : 'https://...'}
              />
            </div>
          )}

          {needsContent && (
            <div>
              <Label>Content (Markdown)</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content here..."
                rows={8}
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(!!checked)}
              />
              <Label htmlFor="required" className="cursor-pointer">
                Required
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Label>Est. Minutes</Label>
              <Input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="10"
                className="w-20"
                min={0}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !title.trim()}>
            {submitting ? 'Saving...' : module ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
