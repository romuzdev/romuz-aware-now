/**
 * Certificate Preview Component
 * 
 * Displays a preview of an earned certificate with PDF generation
 */

import { Card, CardContent, CardHeader } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Download, Share2, Award, Eye } from 'lucide-react';
import { downloadCertificate, previewCertificate, shareCertificate } from '@/modules/training/integration/certificates.integration';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface CertificatePreviewProps {
  certificateId: string;
  enrollmentId?: string;
  courseName: string;
  studentName: string;
  completionDate: string;
  score?: number;
  certificateUrl?: string;
  onDownload?: () => void;
  onShare?: () => void;
}

export function CertificatePreview({
  certificateId,
  enrollmentId,
  courseName,
  studentName,
  completionDate,
  score,
  certificateUrl,
  onDownload,
  onShare,
}: CertificatePreviewProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!enrollmentId) {
      onDownload?.();
      return;
    }
    
    setIsDownloading(true);
    try {
      await downloadCertificate(enrollmentId, `${courseName}-certificate.pdf`);
      toast({
        title: 'تم التحميل',
        description: 'تم تحميل الشهادة بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الشهادة',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (!enrollmentId) return;
    
    try {
      await previewCertificate(enrollmentId);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل عرض الشهادة',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (!enrollmentId) {
      onShare?.();
      return;
    }
    
    try {
      await shareCertificate(enrollmentId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not supported')) {
        toast({
          title: 'غير مدعوم',
          description: 'المشاركة غير متوفرة في متصفحك',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'خطأ',
          description: 'فشلت المشاركة',
          variant: 'destructive',
        });
      }
    }
  };
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-full">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{courseName}</h3>
            <p className="text-sm text-muted-foreground">
              Certificate ID: {certificateId}
            </p>
          </div>
          <Badge variant="default">Completed</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Student Name</div>
              <div className="font-medium">{studentName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completion Date</div>
              <div className="font-medium">
                {new Date(completionDate).toLocaleDateString()}
              </div>
            </div>
            {score !== undefined && (
              <div>
                <div className="text-sm text-muted-foreground">Final Score</div>
                <div className="font-medium text-lg">{score}%</div>
              </div>
            )}
          </div>

          {certificateUrl && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/30">
              <Award className="h-16 w-16 mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground mb-4">
                Certificate of Completion
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleDownload} 
              className="flex-1"
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'جاري التحميل...' : 'Download Certificate'}
            </Button>
            {enrollmentId && (
              <Button onClick={handlePreview} variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                عرض
              </Button>
            )}
            <Button onClick={handleShare} variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
