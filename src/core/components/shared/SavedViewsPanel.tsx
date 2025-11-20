/**
 * Saved Views Panel Component
 * Gate-K: Core Infrastructure - D1 Standard
 * 
 * Reusable component for saved views management
 */

import React, { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
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
import { Badge } from '@/core/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Bookmark, MoreVertical, Plus, Star, Trash2 } from 'lucide-react';
import { useSavedViews } from '@/core/hooks/saved-views/useSavedViews';
import { Skeleton } from '@/core/components/ui/skeleton';

export type SavedViewsPanelProps = {
  pageKey: string;
  currentFilters: any;
  onApplyView: (filters: any) => void;
  className?: string;
};

export function SavedViewsPanel({
  pageKey,
  currentFilters,
  onApplyView,
  className,
}: SavedViewsPanelProps) {
  const {
    views,
    loading,
    createView,
    applyView,
    deleteView,
    setDefault,
    isCreating,
    isDeleting,
    isSettingDefault,
  } = useSavedViews({ pageKey });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const handleCreateView = async () => {
    if (!newViewName.trim()) return;

    try {
      await createView(newViewName, currentFilters);
      setNewViewName('');
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create view:', error);
    }
  };

  const handleApplyView = (viewId: string) => {
    const filters = applyView(viewId);
    if (filters) {
      onApplyView(filters);
    }
  };

  const handleDeleteView = async (viewId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العرض المحفوظ؟')) {
      try {
        await deleteView(viewId);
      } catch (error) {
        console.error('Failed to delete view:', error);
      }
    }
  };

  const handleSetDefault = async (viewId: string) => {
    try {
      await setDefault(viewId);
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            العروض المحفوظة
          </CardTitle>
          <CardDescription>
            احفظ الفلاتر المستخدمة بشكل متكرر للوصول السريع
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            variant="outline"
            className="w-full"
            disabled={isCreating}
          >
            <Plus className="mr-2 h-4 w-4" />
            حفظ العرض الحالي
          </Button>

          {views.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              لا توجد عروض محفوظة بعد
            </p>
          ) : (
            <div className="space-y-1">
              {views.map(view => (
                <div
                  key={view.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent group"
                >
                  <button
                    onClick={() => handleApplyView(view.id)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    {view.is_default && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                    <span className="text-sm font-medium">{view.name}</span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleApplyView(view.id)}>
                        تطبيق العرض
                      </DropdownMenuItem>
                      {!view.is_default && (
                        <DropdownMenuItem
                          onClick={() => handleSetDefault(view.id)}
                          disabled={isSettingDefault}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          تعيين كافتراضي
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteView(view.id)}
                        disabled={isDeleting}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حفظ عرض جديد</DialogTitle>
            <DialogDescription>
              احفظ الفلاتر الحالية كعرض محفوظ للوصول السريع لاحقاً
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="view-name">اسم العرض</Label>
              <Input
                id="view-name"
                value={newViewName}
                onChange={e => setNewViewName(e.target.value)}
                placeholder="مثال: حملات نشطة 2024"
                autoFocus
              />
            </div>

            {Object.keys(currentFilters).length > 0 && (
              <div className="space-y-2">
                <Label>الفلاتر المحفوظة:</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(currentFilters).map(([key, value]: [string, any]) => (
                    <Badge key={key} variant="secondary">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCreateView}
              disabled={!newViewName.trim() || isCreating}
            >
              حفظ العرض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
