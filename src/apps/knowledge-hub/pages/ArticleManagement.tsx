/**
 * M17: Knowledge Hub - Article Management Page
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Switch } from '@/core/components/ui/switch';
import { Label } from '@/core/components/ui/label';
import {
  useKnowledgeArticles,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  usePublishArticle,
  useUnpublishArticle,
} from '@/modules/knowledge/hooks/useKnowledgeArticles';
import { ArticleCard } from '@/modules/knowledge/components/ArticleCard';
import { FileText, Plus, Edit, Trash, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';

export default function ArticleManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);

  const { data: articles, isLoading } = useKnowledgeArticles();
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const deleteMutation = useDeleteArticle();
  const publishMutation = usePublishArticle();
  const unpublishMutation = useUnpublishArticle();

  const [formData, setFormData] = useState({
    title_ar: '',
    content_ar: '',
    summary_ar: '',
    category: 'security',
    document_type: 'guideline',
    tags: '',
    is_published: false,
  });

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setIsCreateDialogOpen(false);
    setFormData({
      title_ar: '',
      content_ar: '',
      summary_ar: '',
      category: 'security',
      document_type: 'guideline',
      tags: '',
      is_published: false,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المقالة؟')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleTogglePublish = async (article: any) => {
    if (article.is_published) {
      await unpublishMutation.mutateAsync(article.id);
    } else {
      await publishMutation.mutateAsync(article.id);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            إدارة المقالات
          </h1>
          <p className="text-muted-foreground mt-1">
            إنشاء وتعديل مقالات قاعدة المعرفة
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              مقالة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء مقالة جديدة</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل المقالة الجديدة
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  placeholder="عنوان المقالة"
                />
              </div>

              <div className="space-y-2">
                <Label>الملخص (عربي)</Label>
                <Textarea
                  value={formData.summary_ar}
                  onChange={(e) => setFormData({ ...formData, summary_ar: e.target.value })}
                  placeholder="ملخص مختصر عن المقالة"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>المحتوى (عربي)</Label>
                <Textarea
                  value={formData.content_ar}
                  onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                  placeholder="محتوى المقالة الكامل"
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الفئة</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security">الأمن السيبراني</SelectItem>
                      <SelectItem value="compliance">الامتثال</SelectItem>
                      <SelectItem value="governance">الحوكمة</SelectItem>
                      <SelectItem value="risk">إدارة المخاطر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>نوع المستند</Label>
                  <Select value={formData.document_type} onValueChange={(v) => setFormData({ ...formData, document_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">سياسة</SelectItem>
                      <SelectItem value="procedure">إجراء</SelectItem>
                      <SelectItem value="guideline">دليل</SelectItem>
                      <SelectItem value="best_practice">أفضل ممارسة</SelectItem>
                      <SelectItem value="faq">أسئلة شائعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوسوم (مفصولة بفاصلة)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="مثال: أمن, كلمات مرور, حماية"
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="publish"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="publish">نشر فوراً</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>المقالات</CardTitle>
          <CardDescription>
            {articles?.length || 0} مقالة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="space-y-4">
              {articles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{article.title_ar}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {article.summary_ar}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={article.is_published ? 'default' : 'secondary'}>
                          {article.is_published ? 'منشور' : 'مسودة'}
                        </Badge>
                        {article.is_verified && (
                          <Badge variant="outline">موثق</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePublish(article)}
                      >
                        {article.is_published ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            إلغاء النشر
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            نشر
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingArticle(article)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(article.id)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">لا توجد مقالات</p>
              <p className="text-sm text-muted-foreground">ابدأ بإنشاء مقالة جديدة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
