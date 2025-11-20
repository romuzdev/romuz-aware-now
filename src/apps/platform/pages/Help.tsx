import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Textarea } from "@/core/components/ui/textarea";
import { Label } from "@/core/components/ui/label";
import { HelpCircle, Mail, Phone, MessageSquare, BookOpen, AlertCircle } from "lucide-react";

/**
 * Help - صفحة المساعدة والدعم
 * 
 * تحتوي على:
 * - الأسئلة الشائعة (FAQ)
 * - نموذج التواصل مع الدعم
 * - معلومات الاتصال
 * - روابط للموارد التعليمية
 */
export default function Help() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('pages.help.title', 'المساعدة والدعم')}
        </h1>
        <p className="text-muted-foreground">
          {t('pages.help.description', 'نحن هنا لمساعدتك. اطلع على الأسئلة الشائعة أو تواصل معنا مباشرة')}
        </p>
      </div>

      {/* الأسئلة الشائعة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {t('pages.help.faq.title', 'الأسئلة الشائعة')}
          </CardTitle>
          <CardDescription>
            {t('pages.help.faq.description', 'إجابات على الأسئلة الأكثر شيوعاً')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                {t('pages.help.faq.q1', 'كيف أبدأ في استخدام المنصة؟')}
              </AccordionTrigger>
              <AccordionContent>
                {t('pages.help.faq.a1', 'بعد تسجيل الدخول، يمكنك استكشاف الحملات المتاحة من لوحة التحكم الرئيسية. انقر على "استكشف الحملات" لعرض جميع حملات التوعية النشطة والمشاركة فيها.')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>
                {t('pages.help.faq.q2', 'كيف أتتبع تقدمي في الحملات؟')}
              </AccordionTrigger>
              <AccordionContent>
                {t('pages.help.faq.a2', 'يمكنك متابعة تقدمك من قسم "التقدم" في القائمة الجانبية. ستجد هناك رسوم بيانية وإحصائيات تفصيلية عن إنجازاتك ونسبة إتمام المهام.')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>
                {t('pages.help.faq.q3', 'ماذا أفعل إذا نسيت كلمة المرور؟')}
              </AccordionTrigger>
              <AccordionContent>
                {t('pages.help.faq.a3', 'في صفحة تسجيل الدخول، انقر على "نسيت كلمة المرور؟" وأدخل بريدك الإلكتروني. ستستلم رابطاً لإعادة تعيين كلمة المرور.')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>
                {t('pages.help.faq.q4', 'كيف يمكنني تغيير إعدادات الإشعارات؟')}
              </AccordionTrigger>
              <AccordionContent>
                {t('pages.help.faq.a4', 'انتقل إلى صفحة "الإعدادات" من القائمة الجانبية، ثم اختر قسم "الإشعارات" لتخصيص تفضيلاتك.')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>
                {t('pages.help.faq.q5', 'هل يمكنني الوصول للمنصة من الهاتف المحمول؟')}
              </AccordionTrigger>
              <AccordionContent>
                {t('pages.help.faq.a5', 'نعم، المنصة متجاوبة بالكامل وتعمل بشكل ممتاز على جميع الأجهزة بما فيها الهواتف المحمولة والأجهزة اللوحية.')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* نموذج التواصل */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t('pages.help.contact.title', 'تواصل معنا')}
          </CardTitle>
          <CardDescription>
            {t('pages.help.contact.description', 'لم تجد إجابتك؟ أرسل لنا رسالة وسنرد عليك في أقرب وقت')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">
              {t('pages.help.contact.subject', 'الموضوع')}
            </Label>
            <Input 
              id="subject" 
              placeholder={t('pages.help.contact.subjectPlaceholder', 'ما هو موضوع استفسارك؟')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">
              {t('pages.help.contact.message', 'الرسالة')}
            </Label>
            <Textarea 
              id="message" 
              placeholder={t('pages.help.contact.messagePlaceholder', 'اكتب رسالتك هنا...')}
              rows={5}
            />
          </div>
          <Button className="w-full">
            {t('pages.help.contact.send', 'إرسال الرسالة')}
          </Button>
        </CardContent>
      </Card>

      {/* معلومات الاتصال */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" />
              {t('pages.help.info.email', 'البريد الإلكتروني')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">support@romuz.sa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 text-primary" />
              {t('pages.help.info.phone', 'الهاتف')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground" dir="ltr">+966 50 123 4567</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              {t('pages.help.info.docs', 'الدليل الإرشادي')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="link" className="p-0 h-auto text-sm">
              {t('pages.help.info.viewDocs', 'عرض الدليل')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* تنبيه */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {t('pages.help.notice.title', 'نعمل على خدمتك')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('pages.help.notice.description', 'أوقات الدعم: من الأحد إلى الخميس، 9 صباحاً - 5 مساءً (بتوقيت السعودية)')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
