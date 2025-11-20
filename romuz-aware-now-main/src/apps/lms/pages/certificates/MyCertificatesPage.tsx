import { Award } from 'lucide-react';
import { Card, CardContent } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useMyCertificates } from '@/modules/training/hooks/useCertificates';
import { CertificateCard } from '@/modules/training/components/certificates';

export default function MyCertificatesPage() {
  const { data: certificates, isLoading } = useMyCertificates();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">شهاداتي</h1>
        <p className="text-muted-foreground mt-2">
          جميع الشهادات التي حصلت عليها من الدورات التدريبية
        </p>
      </div>

      {!certificates || certificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              لم تحصل على أي شهادات بعد. أكمل الدورات التدريبية للحصول على الشهادات.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <CertificateCard key={certificate.id} certificate={certificate} />
          ))}
        </div>
      )}
    </div>
  );
}
