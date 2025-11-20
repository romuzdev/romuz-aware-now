/**
 * M17: Knowledge Hub - Q&A Page
 */

import { useEffect } from 'react';
import { QAInterface } from '../components/QAInterface';

export default function QAPage() {
  useEffect(() => {
    document.title = 'الأسئلة والأجوبة | مركز المعرفة';
  }, []);

  return (
    <main className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">الأسئلة والأجوبة</h1>
        <p className="text-muted-foreground mt-2">
          اسأل أي سؤال وسيجيب الذكاء الاصطناعي بناءً على قاعدة المعرفة
        </p>
      </header>

      <QAInterface />
    </main>
  );
}
