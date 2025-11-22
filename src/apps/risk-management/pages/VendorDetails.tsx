/**
 * Vendor Details Page
 * Comprehensive vendor information with tabs
 */

import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Building2, 
  Edit, 
  Trash2, 
  FileText, 
  Users, 
  Shield, 
  AlertCircle,
  Globe,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/core/components/ui/alert-dialog';
import {
  useVendorById,
  useDeleteVendor,
  useVendorContacts,
  useVendorRiskAssessments,
  useVendorContracts,
  useVendorDocuments,
} from '@/modules/grc/hooks/useThirdPartyRisk';

export default function VendorDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vendor, isLoading } = useVendorById(id!);
  const { data: contacts } = useVendorContacts(id!);
  const { data: assessments } = useVendorRiskAssessments(id);
  const { data: contracts } = useVendorContracts(id);
  const { data: documents } = useVendorDocuments(id);
  const deleteVendor = useDeleteVendor();

  const handleDelete = async () => {
    try {
      await deleteVendor.mutateAsync(id!);
      navigate('/risk/vendors');
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  const getRiskBadgeVariant = (risk: string | null) => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">المورد غير موجود</h3>
        <Button onClick={() => navigate('/risk/vendors')}>
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للقائمة
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/risk/vendors')}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{vendor.vendor_name_ar}</h1>
          {vendor.vendor_name_en && (
            <p className="text-muted-foreground">{vendor.vendor_name_en}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/risk/vendors/${id}/edit`)}
          >
            <Edit className="h-4 w-4 ml-2" />
            تعديل
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم حذف المورد نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الحالة</p>
              <Badge variant={getStatusBadgeVariant(vendor.status)}>
                {vendor.status || 'غير محدد'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مستوى المخاطر</p>
              {vendor.overall_risk_level ? (
                <Badge variant={getRiskBadgeVariant(vendor.overall_risk_level)}>
                  {vendor.overall_risk_level}
                </Badge>
              ) : (
                <span className="text-sm">غير محدد</span>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">التقييمات</p>
              <p className="text-xl font-bold">{assessments?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">العقود</p>
              <p className="text-xl font-bold">{contracts?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">المعلومات</TabsTrigger>
          <TabsTrigger value="contacts">جهات الاتصال ({contacts?.length || 0})</TabsTrigger>
          <TabsTrigger value="assessments">التقييمات ({assessments?.length || 0})</TabsTrigger>
          <TabsTrigger value="contracts">العقود ({contracts?.length || 0})</TabsTrigger>
          <TabsTrigger value="documents">المستندات ({documents?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">معلومات المورد</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {vendor.vendor_code && (
                  <div>
                    <p className="text-sm text-muted-foreground">رمز المورد</p>
                    <p className="font-medium">{vendor.vendor_code}</p>
                  </div>
                )}
                {vendor.vendor_type && (
                  <div>
                    <p className="text-sm text-muted-foreground">نوع المورد</p>
                    <p className="font-medium">{vendor.vendor_type}</p>
                  </div>
                )}
                {vendor.industry && (
                  <div>
                    <p className="text-sm text-muted-foreground">القطاع</p>
                    <p className="font-medium">{vendor.industry}</p>
                  </div>
                )}
                {vendor.risk_tier && (
                  <div>
                    <p className="text-sm text-muted-foreground">مستوى التصنيف</p>
                    <p className="font-medium">{vendor.risk_tier}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {vendor.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {vendor.website}
                    </a>
                  </div>
                )}
                {(vendor.country || vendor.city || vendor.address) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      {vendor.address && <p>{vendor.address}</p>}
                      {vendor.city && <p>{vendor.city}</p>}
                      {vendor.country && <p>{vendor.country}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {vendor.notes && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-2">ملاحظات</p>
                <p className="whitespace-pre-wrap">{vendor.notes}</p>
              </div>
            )}
          </Card>

          {(vendor.contract_start_date || vendor.contract_end_date) && (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">معلومات العقد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendor.contract_start_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ البداية</p>
                    <p className="font-medium">
                      {new Date(vendor.contract_start_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                )}
                {vendor.contract_end_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                    <p className={`font-medium ${
                      new Date(vendor.contract_end_date) < new Date() ? 'text-destructive' : ''
                    }`}>
                      {new Date(vendor.contract_end_date).toLocaleDateString('ar-SA')}
                      {new Date(vendor.contract_end_date) < new Date() && (
                        <span className="mr-2 text-sm">(منتهي)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">جهات الاتصال</h3>
              <Button size="sm">
                <Users className="h-4 w-4 ml-2" />
                إضافة جهة اتصال
              </Button>
            </div>
            {contacts && contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{contact.full_name}</p>
                        {contact.job_title && (
                          <p className="text-sm text-muted-foreground">{contact.job_title}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          {contact.email && (
                            <p className="text-sm">
                              <Mail className="h-3 w-3 inline ml-1" />
                              {contact.email}
                            </p>
                          )}
                          {contact.phone && (
                            <p className="text-sm">
                              <Phone className="h-3 w-3 inline ml-1" />
                              {contact.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      {contact.is_primary && (
                        <Badge variant="default">جهة اتصال رئيسية</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد جهات اتصال</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">تقييمات المخاطر</h3>
              <Button size="sm" onClick={() => navigate('/risk/assessments/new')}>
                <Shield className="h-4 w-4 ml-2" />
                تقييم جديد
              </Button>
            </div>
            {assessments && assessments.length > 0 ? (
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/risk/assessments/${assessment.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          {new Date(assessment.assessment_date).toLocaleDateString('ar-SA')}
                        </p>
                        <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">الإجمالي: </span>
                            <span className="font-medium">{assessment.overall_risk_score || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">أمني: </span>
                            <span className="font-medium">{assessment.security_risk_score || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">امتثال: </span>
                            <span className="font-medium">{assessment.compliance_risk_score || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">مالي: </span>
                            <span className="font-medium">{assessment.financial_risk_score || 0}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={assessment.status === 'completed' ? 'default' : 'outline'}>
                        {assessment.status === 'completed' ? 'مكتمل' : 
                         assessment.status === 'in_progress' ? 'قيد التنفيذ' : 'معلق'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد تقييمات</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">العقود</h3>
              <Button size="sm" onClick={() => navigate('/risk/contracts/new')}>
                <FileText className="h-4 w-4 ml-2" />
                عقد جديد
              </Button>
            </div>
            {contracts && contracts.length > 0 ? (
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/risk/contracts/${contract.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{contract.contract_code}</p>
                        <p className="text-sm text-muted-foreground">{contract.contract_title_ar}</p>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex gap-4">
                            <span className="text-muted-foreground">البداية:</span>
                            <span>{new Date(contract.effective_date).toLocaleDateString('ar-SA')}</span>
                          </div>
                          {contract.expiry_date && (
                            <div className="flex gap-4">
                              <span className="text-muted-foreground">الانتهاء:</span>
                              <span className={
                                new Date(contract.expiry_date) < new Date() ? 'text-destructive' : ''
                              }>
                                {new Date(contract.expiry_date).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                        {contract.status === 'active' ? 'نشط' :
                         contract.status === 'expired' ? 'منتهي' : 'معلق'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد عقود</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">المستندات</h3>
              <Button size="sm">
                <FileText className="h-4 w-4 ml-2" />
                رفع مستند
              </Button>
            </div>
            {documents && documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{doc.document_name_ar}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.document_type} • {new Date(doc.uploaded_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        عرض
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد مستندات</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
