import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/core/components/ui/card';
import { AuditForm } from '@/apps/grc/components/AuditForm';

export default function AuditNew() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'إضافة تدقيق جديد | Romuz';
  }, []);

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">إضافة تدقيق جديد</h1>
        <p className="text-muted-foreground mt-1">قم بإدخال تفاصيل خطة التدقيق الجديدة.</p>
      </header>

      <Card className="p-6">
        <AuditForm
          onSuccess={() => navigate('/audit/audits')}
          onCancel={() => navigate(-1)}
        />
      </Card>
    </main>
  );
}
