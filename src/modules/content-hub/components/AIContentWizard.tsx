/**
 * M13.1 - Content Hub: AI Content Wizard
 * معالج AI تفاعلي لتوليد المحتوى مع دعم الصور
 */

import { useState } from 'react';
import { Wand2, Loader2, Check, FileText, Image as ImageIcon, Languages } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Card } from '@/core/components/ui/card';
import { useToast } from '@/core/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIContentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (content: any) => void;
}

type ContentGenerationType = 'article' | 'image' | 'translation';
type Step = 'select-type' | 'input' | 'generating' | 'review';

export function AIContentWizard({
  open,
  onOpenChange,
  onComplete,
}: AIContentWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('select-type');
  const [generationType, setGenerationType] = useState<ContentGenerationType | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State for Article Generation
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<string>('article');
  const [tone, setTone] = useState<string>('formal');
  const [length, setLength] = useState<string>('medium');

  // Form State for Image Generation
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageLanguage, setImageLanguage] = useState<'ar' | 'en'>('ar');

  // Form State for Translation
  const [translationText, setTranslationText] = useState('');
  const [sourceLang, setSourceLang] = useState<'ar' | 'en'>('ar');
  const [targetLang, setTargetLang] = useState<'ar' | 'en'>('en');

  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const handleSelectType = (type: ContentGenerationType) => {
    setGenerationType(type);
    setCurrentStep('input');
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setCurrentStep('generating');

      let action: string;
      let body: any;

      if (generationType === 'article') {
        action = 'generate_article';
        body = { topic, tone, length, contentType };
      } else if (generationType === 'image') {
        action = 'generate_image';
        body = { prompt: imagePrompt, language: imageLanguage };
      } else if (generationType === 'translation') {
        action = 'translate';
        body = { 
          content: translationText, 
          sourceLanguage: sourceLang,
          targetLanguage: targetLang 
        };
      }

      const { data, error } = await supabase.functions.invoke('content-ai-generator', {
        body: { action, ...body },
      });

      if (error) throw error;

      setGeneratedContent(data.data);
      setCurrentStep('review');
      
      toast({
        title: 'تم التوليد',
        description: 'تم توليد المحتوى بنجاح',
      });
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في توليد المحتوى',
        variant: 'destructive',
      });
      setCurrentStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (generatedContent && onComplete) {
      onComplete(generatedContent);
    }
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep('select-type');
    setGenerationType(null);
    setTopic('');
    setImagePrompt('');
    setTranslationText('');
    setGeneratedContent(null);
    onOpenChange(false);
  };

  const canProceed = () => {
    if (currentStep === 'input') {
      if (generationType === 'article') return topic.trim().length > 0;
      if (generationType === 'image') return imagePrompt.trim().length > 0;
      if (generationType === 'translation') return translationText.trim().length > 0;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            معالج توليد المحتوى بالذكاء الاصطناعي
          </DialogTitle>
          <DialogDescription>
            استخدم الذكاء الاصطناعي لتوليد محتوى عالي الجودة بسهولة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Select Generation Type */}
          {currentStep === 'select-type' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">اختر نوع المحتوى</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className="p-6 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelectType('article')}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <FileText className="h-12 w-12 text-primary" />
                    <h4 className="font-semibold">توليد مقالة</h4>
                    <p className="text-sm text-muted-foreground">
                      قم بتوليد مقالة كاملة من موضوع معين
                    </p>
                  </div>
                </Card>

                <Card
                  className="p-6 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelectType('image')}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <ImageIcon className="h-12 w-12 text-primary" />
                    <h4 className="font-semibold">توليد صورة</h4>
                    <p className="text-sm text-muted-foreground">
                      أنشئ صورة من وصف نصي
                    </p>
                  </div>
                </Card>

                <Card
                  className="p-6 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelectType('translation')}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <Languages className="h-12 w-12 text-primary" />
                    <h4 className="font-semibold">ترجمة محتوى</h4>
                    <p className="text-sm text-muted-foreground">
                      ترجم بين العربية والإنجليزية
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Step 2: Input Form */}
          {currentStep === 'input' && (
            <div className="space-y-4">
              {generationType === 'article' && (
                <>
                  <div>
                    <Label>موضوع المقالة</Label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="مثال: أهمية الأمن السيبراني في الشركات"
                      className="text-right"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <Label>نوع المحتوى</Label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">مقالة</SelectItem>
                        <SelectItem value="guide">دليل</SelectItem>
                        <SelectItem value="tip">نصيحة سريعة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>الأسلوب</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">رسمي</SelectItem>
                        <SelectItem value="casual">غير رسمي</SelectItem>
                        <SelectItem value="technical">تقني</SelectItem>
                        <SelectItem value="friendly">ودي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>الطول</Label>
                    <Select value={length} onValueChange={setLength}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">قصير (200-300 كلمة)</SelectItem>
                        <SelectItem value="medium">متوسط (500-700 كلمة)</SelectItem>
                        <SelectItem value="long">طويل (1000+ كلمة)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {generationType === 'image' && (
                <>
                  <div>
                    <Label>وصف الصورة</Label>
                    <Textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="صف الصورة التي تريد توليدها بالتفصيل..."
                      rows={5}
                      className="text-right"
                      dir="rtl"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      مثال: رسم توضيحي لشخص يعمل على حاسوب محمول في بيئة عمل احترافية، بألوان زاهية وأسلوب عصري
                    </p>
                  </div>

                  <div>
                    <Label>لغة الوصف</Label>
                    <Select value={imageLanguage} onValueChange={(v: 'ar' | 'en') => setImageLanguage(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {generationType === 'translation' && (
                <>
                  <div>
                    <Label>النص المراد ترجمته</Label>
                    <Textarea
                      value={translationText}
                      onChange={(e) => setTranslationText(e.target.value)}
                      placeholder="أدخل النص هنا..."
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>من</Label>
                      <Select value={sourceLang} onValueChange={(v: 'ar' | 'en') => setSourceLang(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>إلى</Label>
                      <Select value={targetLang} onValueChange={(v: 'ar' | 'en') => setTargetLang(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Generating */}
          {currentStep === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h3 className="text-lg font-semibold">جاري التوليد...</h3>
              <p className="text-sm text-muted-foreground">
                {generationType === 'article' && 'نقوم بكتابة المقالة لك'}
                {generationType === 'image' && 'نقوم بإنشاء الصورة'}
                {generationType === 'translation' && 'نقوم بترجمة النص'}
              </p>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && generatedContent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <h3 className="text-lg font-semibold">تم التوليد بنجاح!</h3>
              </div>

              {generationType === 'image' && generatedContent.image_url ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={generatedContent.image_url} 
                      alt="Generated content" 
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    تم توليد الصورة باستخدام {generatedContent.model}
                  </p>
                </div>
              ) : (
                <Card className="p-4">
                  <div className="prose prose-sm max-w-none" dir={generationType === 'article' ? 'rtl' : 'auto'}>
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(generatedContent, null, 2)}
                    </pre>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          {currentStep === 'select-type' && (
            <Button variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
          )}

          {currentStep === 'input' && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep('select-type')}>
                رجوع
              </Button>
              <Button onClick={handleGenerate} disabled={!canProceed()}>
                توليد
              </Button>
            </>
          )}

          {currentStep === 'review' && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep('input')}>
                توليد مرة أخرى
              </Button>
              <Button onClick={handleSave}>
                حفظ واستخدام
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
