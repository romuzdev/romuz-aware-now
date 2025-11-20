/**
 * M17: Knowledge Hub - Knowledge Graph Page
 */

import { useEffect } from 'react';
import { Network } from 'lucide-react';
import { Card } from '@/core/components/ui/card';

export default function GraphPage() {
  useEffect(() => {
    document.title = 'الرسم البياني المعرفي | مركز المعرفة';
  }, []);

  return (
    <main className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Network className="h-8 w-8 text-primary" />
          الرسم البياني المعرفي
        </h1>
        <p className="text-muted-foreground mt-2">
          استكشف العلاقات بين المستندات المختلفة
        </p>
      </header>

      <Card className="p-12 text-center">
        <Network className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">قريباً</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          سيتم إضافة الرسم البياني التفاعلي للعلاقات المعرفية في التحديث القادم
        </p>
      </Card>
    </main>
  );
}
