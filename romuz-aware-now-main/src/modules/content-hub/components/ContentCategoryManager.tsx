/**
 * M13.1 - Content Category Manager Component
 * إدارة التصنيفات الهرمية مع Drag & Drop
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Folder, FolderOpen, Plus, Edit, Trash2, GripVertical, ChevronRight, ChevronDown
} from 'lucide-react';

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
}

export function ContentCategoryManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    parent_id: null as string | null,
    icon: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Build hierarchical structure
      const hierarchical = buildHierarchy(data || []);
      setCategories(hierarchical);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (flatCategories: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    // Create a map of all categories
    flatCategories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    // Build the tree
    flatCategories.forEach(cat => {
      const category = map.get(cat.id)!;
      if (cat.parent_id) {
        const parent = map.get(cat.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      } else {
        roots.push(category);
      }
    });

    return roots;
  };

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name_ar: category.name_ar,
        name_en: category.name_en,
        parent_id: category.parent_id,
        icon: category.icon || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name_ar: '',
        name_en: '',
        parent_id: null,
        icon: '',
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name_ar: '',
      name_en: '',
      parent_id: null,
      icon: '',
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name_ar || !formData.name_en) {
        toast({
          title: t('common.error'),
          description: 'الاسم مطلوب بكلتا اللغتين',
          variant: 'destructive',
        });
        return;
      }

      if (editingCategory) {
        // Update
        const { error } = await supabase
          .from('content_categories')
          .update({
            name_ar: formData.name_ar,
            name_en: formData.name_en,
            parent_id: formData.parent_id,
            icon: formData.icon || null,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('content_categories')
          .insert({
            name_ar: formData.name_ar,
            name_en: formData.name_en,
            parent_id: formData.parent_id,
            icon: formData.icon || null,
            sort_order: 999, // Will be reordered
          });

        if (error) throw error;
      }

      toast({
        title: t('common.success'),
        description: editingCategory ? 'تم تحديث التصنيف' : 'تم إضافة التصنيف',
      });

      closeDialog();
      fetchCategories();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;

    try {
      const { error } = await supabase
        .from('content_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: 'تم حذف التصنيف',
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order
    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));

    try {
      for (const update of updates) {
        await supabase
          .from('content_categories')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setCategories(items);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div
          className="flex items-center gap-2 p-3 hover:bg-accent rounded-lg group"
          style={{ marginRight: `${level * 24}px` }}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          
          {hasChildren ? (
            <button onClick={() => toggleExpand(category.id)} className="p-1">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {category.icon ? (
            <span className="text-xl">{category.icon}</span>
          ) : hasChildren ? (
            isExpanded ? <FolderOpen className="h-5 w-5 text-primary" /> : <Folder className="h-5 w-5 text-primary" />
          ) : (
            <Folder className="h-5 w-5 text-muted-foreground" />
          )}

          <div className="flex-1">
            <div className="font-medium">{category.name_ar}</div>
            <div className="text-sm text-muted-foreground">{category.name_en}</div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openDialog(category)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة التصنيفات</h2>
          <p className="text-muted-foreground">نظم تصنيفات المحتوى بشكل هرمي</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 ml-2" />
          تصنيف جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>التصنيفات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              لا توجد تصنيفات. ابدأ بإضافة تصنيف جديد.
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {categories.map((category, index) => (
                      <Draggable key={category.id} draggableId={category.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            {renderCategory(category)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'تحرير التصنيف' : 'تصنيف جديد'}</DialogTitle>
            <DialogDescription>
              أدخل معلومات التصنيف بكلتا اللغتين
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>الاسم (عربي)</Label>
              <Input
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="اسم التصنيف بالعربية"
                dir="rtl"
              />
            </div>

            <div>
              <Label>Name (English)</Label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Category name in English"
              />
            </div>

            <div>
              <Label>أيقونة (Emoji)</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="📁"
                maxLength={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              {editingCategory ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
