import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/core/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { seedAwarenessTestData, clearTestData } from '@/integrations/supabase/test-data';

export default function AwarenessSettingsPage() {
  const { t } = useTranslation();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    document.title = `${t('awareness.settings.title')} | Romuz`;
  }, [t]);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const res = await seedAwarenessTestData();
      toast.success(res.message || 'تم إنشاء البيانات التجريبية');
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message || 'فشل في إنشاء البيانات التجريبية');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClear = async () => {
    const ok = window.confirm('هل أنت متأكد من حذف جميع البيانات التجريبية؟');
    if (!ok) return;
    try {
      setIsClearing(true);
      const res = await clearTestData();
      toast.success(res.message || 'تم حذف البيانات التجريبية');
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message || 'فشل في حذف البيانات التجريبية');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <main className="container mx-auto py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{t('awareness.settings.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('awareness.settings.description')}</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium">{t('awareness.settings.general.title')}</h2>
          <p className="text-sm text-muted-foreground mt-2">{t('awareness.settings.general.description')}</p>
        </article>
        <article className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium">{t('awareness.settings.notifications.title')}</h2>
          <p className="text-sm text-muted-foreground mt-2">{t('awareness.settings.notifications.description')}</p>
        </article>
      </section>

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-medium">البيانات التجريبية (Awareness)</h2>
        <p className="text-sm text-muted-foreground mt-2">
          إنشاء/حذف بيانات تجريبية للحملات والسياسات واللجان والأهداف ومؤشرات الأداء والمشاركين.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleSeed} disabled={isSeeding || isClearing} variant="secondary">
            <Plus className="ml-2 h-4 w-4" />
            {isSeeding ? 'جاري الإنشاء...' : 'إنشاء بيانات تجريبية'}
          </Button>
          <Button onClick={handleClear} disabled={isSeeding || isClearing} variant="destructive">
            <Trash2 className="ml-2 h-4 w-4" />
            {isClearing ? 'جاري الحذف...' : 'حذف البيانات التجريبية'}
          </Button>
        </div>
      </section>
    </main>
  );
}
