/**
 * M13.1 - Content Editor Component
 * محرر محتوى متقدم مع Rich Text Editor
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Separator } from '@/core/components/ui/separator';
import { Badge } from '@/core/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, List, ListOrdered,
  Quote, Undo, Redo, Link as LinkIcon, Image as ImageIcon, Eye, Save, Clock
} from 'lucide-react';

interface ContentEditorProps {
  contentId?: string;
  initialData?: {
    title_ar?: string;
    title_en?: string;
    content_ar?: string;
    content_en?: string;
    content_type?: string;
    status?: string;
    category_id?: string;
    tags?: string[];
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string[];
  };
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export function ContentEditor({ contentId, initialData, onSave, onCancel }: ContentEditorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'ar' | 'en'>('ar');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Form state
  const [titleAr, setTitleAr] = useState(initialData?.title_ar || '');
  const [titleEn, setTitleEn] = useState(initialData?.title_en || '');
  const [contentType, setContentType] = useState(initialData?.content_type || 'article');
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || '');
  const [seoKeywords, setSeoKeywords] = useState(initialData?.seo_keywords?.join(', ') || '');

  // Arabic editor
  const editorAr = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'ابدأ الكتابة...',
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: initialData?.content_ar || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[400px] p-4 focus:outline-none',
        dir: 'rtl',
      },
    },
  });

  // English editor
  const editorEn = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: initialData?.content_en || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleAutoSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [titleAr, titleEn, editorAr, editorEn]);

  const handleAutoSave = async () => {
    if (!titleAr && !titleEn) return;
    
    try {
      const data = gatherFormData();
      // Save to localStorage as backup
      localStorage.setItem(`content-draft-${contentId || 'new'}`, JSON.stringify(data));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const gatherFormData = () => {
    return {
      title_ar: titleAr,
      title_en: titleEn,
      content_ar: editorAr?.getHTML() || '',
      content_en: editorEn?.getHTML() || '',
      content_type: contentType,
      status,
      tags,
      seo_title: seoTitle,
      seo_description: seoDescription,
      seo_keywords: seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
    };
  };

  const handleSave = async () => {
    if (!titleAr && !titleEn) {
      toast({
        title: t('common.error'),
        description: 'العنوان مطلوب في إحدى اللغات على الأقل',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const data = gatherFormData();
      await onSave?.(data);
      
      // Clear draft from localStorage
      localStorage.removeItem(`content-draft-${contentId || 'new'}`);
      
      toast({
        title: t('common.success'),
        description: 'تم حفظ المحتوى بنجاح',
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'فشل حفظ المحتوى',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const activeEditor = activeTab === 'ar' ? editorAr : editorEn;

  if (!editorAr || !editorEn) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{contentId ? 'تحرير المحتوى' : 'محتوى جديد'}</h2>
          {lastSaved && (
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3" />
              آخر حفظ: {lastSaved.toLocaleTimeString('ar')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 ml-2" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Language Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ar' | 'en')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ar">العربية</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>

            <TabsContent value="ar" className="space-y-4">
              <div>
                <Label>العنوان (عربي)</Label>
                <Input
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="أدخل عنوان المحتوى بالعربية"
                  className="text-right"
                  dir="rtl"
                />
              </div>
            </TabsContent>

            <TabsContent value="en" className="space-y-4">
              <div>
                <Label>Title (English)</Label>
                <Input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Enter content title in English"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Editor Toolbar */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-1 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeEditor.chain().focus().toggleBold().run()}
                  disabled={!activeEditor.can().chain().focus().toggleBold().run()}
                  className={activeEditor.isActive('bold') ? 'bg-accent' : ''}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeEditor.chain().focus().toggleItalic().run()}
                  disabled={!activeEditor.can().chain().focus().toggleItalic().run()}
                  className={activeEditor.isActive('italic') ? 'bg-accent' : ''}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeEditor.chain().focus().toggleStrike().run()}
                  disabled={!activeEditor.can().chain().focus().toggleStrike().run()}
                  className={activeEditor.isActive('strike') ? 'bg-accent' : ''}
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeEditor.chain().focus().toggleCode().run()}
                  disabled={!activeEditor.can().chain().focus().toggleCode().run()}
                  className={activeEditor.isActive('code') ? 'bg-accent' : ''}
                >
                  <Code className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeEditor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={activeEditor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={activeEditor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
                >
                  <Heading2 className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeEditor.chain().focus().toggleBulletList().run()}
                  className={activeEditor.isActive('bulletList') ? 'bg-accent' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeEditor.chain().focus().toggleOrderedList().run()}
                  className={activeEditor.isActive('orderedList') ? 'bg-accent' : ''}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeEditor.chain().focus().toggleBlockquote().run()}
                  className={activeEditor.isActive('blockquote') ? 'bg-accent' : ''}
                >
                  <Quote className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeEditor.chain().focus().undo().run()}
                  disabled={!activeEditor.can().chain().focus().undo().run()}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeEditor.chain().focus().redo().run()}
                  disabled={!activeEditor.can().chain().focus().redo().run()}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <EditorContent editor={activeEditor} className="border-t" />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Content Settings */}
          <Card>
            <CardHeader>
              <CardTitle>إعدادات المحتوى</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>نوع المحتوى</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">مقالة</SelectItem>
                    <SelectItem value="video">فيديو</SelectItem>
                    <SelectItem value="infographic">إنفوجرافيك</SelectItem>
                    <SelectItem value="guide">دليل</SelectItem>
                    <SelectItem value="tip">نصيحة سريعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>الحالة</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="review">قيد المراجعة</SelectItem>
                    <SelectItem value="published">منشور</SelectItem>
                    <SelectItem value="archived">مؤرشف</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>الوسوم</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="أضف وسم"
                  />
                  <Button onClick={addTag} size="sm">إضافة</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>تحسين محركات البحث (SEO)</CardTitle>
              <CardDescription>قم بتحسين ظهور المحتوى في محركات البحث</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>عنوان SEO</Label>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="عنوان محسن لمحركات البحث"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">{seoTitle.length}/60</p>
              </div>

              <div>
                <Label>وصف SEO</Label>
                <Input
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="وصف محسن لمحركات البحث"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">{seoDescription.length}/160</p>
              </div>

              <div>
                <Label>كلمات مفتاحية</Label>
                <Input
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="كلمات، مفصولة، بفواصل"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
