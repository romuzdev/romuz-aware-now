/**
 * M13.1 - Content Hub: Content Bookmark Dialog
 * مربع حوار حفظ المحتوى في الإشارات المرجعية
 */

import { useState, useEffect } from 'react';
import { Bookmark, Folder, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { useToast } from '@/core/components/ui/use-toast';
import { useContentBookmarks } from '../hooks/useContentBookmarks';

interface ContentBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentTitle: string;
}

export function ContentBookmarkDialog({
  open,
  onOpenChange,
  contentId,
  contentTitle,
}: ContentBookmarkDialogProps) {
  const { toast } = useToast();
  const {
    bookmarks,
    folders,
    handleToggleBookmark,
    handleUpdateBookmark,
    isLoading,
  } = useContentBookmarks(contentId);

  const [newFolder, setNewFolder] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  const isBookmarked = bookmarks.length > 0;
  const existingBookmark = bookmarks[0];

  useEffect(() => {
    if (existingBookmark) {
      setSelectedFolder(existingBookmark.folder_name || '');
      setNotes(existingBookmark.notes || '');
    }
  }, [existingBookmark]);

  const handleSave = async () => {
    try {
      const folderName = showNewFolder && newFolder ? newFolder : selectedFolder;

      if (isBookmarked && existingBookmark) {
        // Update existing bookmark
        await handleUpdateBookmark(
          existingBookmark.id,
          folderName || undefined,
          notes || undefined
        );
      } else {
        // Add new bookmark
        await handleToggleBookmark(
          contentId,
          folderName || undefined,
          notes || undefined
        );
      }

      toast({
        title: 'تم الحفظ',
        description: isBookmarked
          ? 'تم تحديث الإشارة المرجعية'
          : 'تم إضافة المحتوى إلى الإشارات المرجعية',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل حفظ الإشارة المرجعية',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async () => {
    if (!existingBookmark) return;

    try {
      await handleToggleBookmark(contentId);
      toast({
        title: 'تم الإزالة',
        description: 'تم إزالة المحتوى من الإشارات المرجعية',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل إزالة الإشارة المرجعية',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            {isBookmarked ? 'تحديث الإشارة المرجعية' : 'حفظ في الإشارات المرجعية'}
          </DialogTitle>
          <DialogDescription>
            {contentTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Folder Selection */}
          <div className="space-y-2">
            <Label>المجلد</Label>
            
            {!showNewFolder ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                  >
                    <option value="">بدون مجلد</option>
                    {folders.map((folder) => (
                      <option key={folder} value={folder}>
                        {folder}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewFolder(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  placeholder="اسم المجلد الجديد"
                  dir="rtl"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolder('');
                  }}
                >
                  إلغاء
                </Button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات (اختياري)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات حول هذا المحتوى..."
              rows={3}
              dir="rtl"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isBookmarked && (
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={isLoading}
              >
                إزالة من الإشارات
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isBookmarked ? 'تحديث' : 'حفظ'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
