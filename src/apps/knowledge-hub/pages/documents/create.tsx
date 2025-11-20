/**
 * M17: Knowledge Hub - Create Document Page
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Save } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { useKnowledgeDocuments } from '../../hooks/useKnowledgeDocuments';

export default function CreateDocumentPage() {
  const navigate = useNavigate();
  const { createDocument, isCreating } = useKnowledgeDocuments();
  
  const [formData, setFormData] = useState({
    title_ar: '',
    content_ar: '',
    summary_ar: '',
    document_type: 'guideline',
    category: '',
    tags: [] as string[],
  });

  useEffect(() => {
    document.title = 'إضافة مستند | مركز المعرفة';
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDocument(formData);
  };

  return (
    <main className="container mx-auto py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowRight className="ml-2 h-4 w-4" />
            رجوع
          </Button>
          <h1 className="text-3xl font-bold">إضافة مستند جديد</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="p-8 space-y-6">
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input
              value={formData.title_ar}
              onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>نوع المستند</Label>
            <Select
              value={formData.document_type}
              onValueChange={(value) => setFormData({ ...formData, document_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="policy">سياسة</SelectItem>
                <SelectItem value="procedure">إجراء</SelectItem>
                <SelectItem value="guideline">إرشادات</SelectItem>
                <SelectItem value="standard">معيار</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>الفئة</Label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>ملخص</Label>
            <Textarea
              value={formData.summary_ar}
              onChange={(e) => setFormData({ ...formData, summary_ar: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>المحتوى</Label>
            <Textarea
              value={formData.content_ar}
              onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
              rows={10}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isCreating}>
              <Save className="ml-2 h-4 w-4" />
              {isCreating ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </Card>
      </form>
    </main>
  );
}
