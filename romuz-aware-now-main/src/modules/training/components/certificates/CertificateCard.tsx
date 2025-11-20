import { Card, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Download, Award, Calendar, Hash } from 'lucide-react';
import type { Certificate } from '../../types';
import { downloadCertificate } from '../../integration/certificates.integration';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface CertificateCardProps {
  certificate: Certificate;
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    // Note: This uses certificate.id but we need enrollment_id
    // For now, we'll show a message that enrollment_id is required
    if (!certificate.enrollment_id) {
      toast({
        title: 'خطأ',
        description: 'معرف التسجيل مفقود',
        variant: 'destructive',
      });
      return;
    }

    setIsDownloading(true);
    try {
      await downloadCertificate(certificate.enrollment_id, `certificate-${certificate.certificate_number}.pdf`);
      toast({
        title: 'تم التحميل',
        description: 'تم تحميل الشهادة بنجاح',
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الشهادة',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {certificate.course?.name || 'شهادة إتمام دورة'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {certificate.course?.code}
              </p>
            </div>
          </div>
          {certificate.is_revoked && (
            <Badge variant="destructive">ملغاة</Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            <span>رقم الشهادة: {certificate.certificate_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>تاريخ الإصدار: {new Date(certificate.issued_at).toLocaleDateString('ar')}</span>
          </div>
          {certificate.expires_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>تاريخ الانتهاء: {new Date(certificate.expires_at).toLocaleDateString('ar')}</span>
            </div>
          )}
        </div>

        {!certificate.is_revoked && (
          <div className="flex gap-2">
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1"
            >
              <Download className="ml-2 h-4 w-4" />
              {isDownloading ? 'جاري التحميل...' : 'تحميل الشهادة'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
