/**
 * Certificates Page
 * Displays user certificates
 */

import { useQuery } from '@tanstack/react-query';
import { Award, Download, Share2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { fetchUserCertificates } from '@/integrations/supabase/lms/certificates.integration';
import { useAppContext } from '@/lib/app-context/AppContextProvider';

export default function CertificatesPage() {
  const { user } = useAppContext();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['my-certificates', user?.id],
    queryFn: () => fetchUserCertificates(user?.id || ''),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Award className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">شهاداتي</h1>
        </div>
        <p className="text-muted-foreground">
          جميع الشهادات التي حصلت عليها من إكمال الدورات
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشهادات</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">هذا الشهر</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {certificates?.filter(c => {
                const issueDate = new Date(c.issued_at);
                const now = new Date();
                return issueDate.getMonth() === now.getMonth() && 
                       issueDate.getFullYear() === now.getFullYear();
              }).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">هذا العام</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {certificates?.filter(c => {
                const issueDate = new Date(c.issued_at);
                const now = new Date();
                return issueDate.getFullYear() === now.getFullYear();
              }).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates Grid */}
      {certificates && certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Award className="h-8 w-8 text-primary" />
                  <Badge variant="outline" className="text-xs">
                    {certificate.certificate_number}
                  </Badge>
                </div>
                <CardTitle className="mt-4">شهادة إتمام</CardTitle>
                <CardDescription>
                  صدرت في: {new Date(certificate.issued_at).toLocaleDateString('ar', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button variant="default" className="w-full">
                    <ExternalLink className="h-4 w-4 ml-2" />
                    عرض الشهادة
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 ml-2" />
                      تحميل
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 ml-2" />
                      مشاركة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد شهادات بعد</h3>
            <p className="text-muted-foreground mb-4">
              أكمل دورة تدريبية للحصول على شهادتك الأولى
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
