import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useCertificateTemplates } from '@/modules/training/hooks/useCertificates';
import { TemplateList } from '@/modules/training/components/certificates';

export default function CertificateTemplatesPage() {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useCertificateTemplates();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/lms/courses')}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">قوالب الشهادات</h1>
          <p className="text-muted-foreground mt-2">
            إدارة قوالب الشهادات المستخدمة في الدورات التدريبية
          </p>
        </div>
      </div>

      <TemplateList templates={templates || []} />
    </div>
  );
}
