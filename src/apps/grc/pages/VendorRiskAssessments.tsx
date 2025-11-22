/**
 * Vendor Risk Assessments Page
 * View and manage vendor risk assessments
 */

import { useState } from 'react';
import { Plus, FileSearch, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVendorRiskAssessments } from '@/modules/grc/hooks/useThirdPartyRisk';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function VendorRiskAssessments() {
  const navigate = useNavigate();
  const { data: assessments, isLoading } = useVendorRiskAssessments();
  const [filter, setFilter] = useState<string>('all');

  const filteredAssessments = assessments?.filter((assessment) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return assessment.status === 'completed';
    if (filter === 'pending') return assessment.status === 'in_progress' || assessment.status === 'pending';
    if (filter === 'high-risk') return assessment.overall_risk_level === 'high' || assessment.overall_risk_level === 'critical';
    return true;
  });

  const getRiskBadgeVariant = (risk: string | null) => {
    switch (risk) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">تقييمات مخاطر الموردين</h1>
          <p className="text-muted-foreground mt-1">
            تقييم وتتبع مخاطر الموردين والأطراف الثالثة
          </p>
        </div>
        <Button onClick={() => navigate('/grc/risk-assessments/new')}>
          <Plus className="h-4 w-4 ml-2" />
          تقييم جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي التقييمات</p>
              <p className="text-2xl font-bold">{assessments?.length || 0}</p>
            </div>
            <FileSearch className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">تقييمات مكتملة</p>
              <p className="text-2xl font-bold">
                {assessments?.filter((a) => a.status === 'completed').length || 0}
              </p>
            </div>
            <FileSearch className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مخاطر عالية</p>
              <p className="text-2xl font-bold text-destructive">
                {assessments?.filter((a) => a.overall_risk_level === 'high' || a.overall_risk_level === 'critical')
                  .length || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-destructive" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
              <p className="text-2xl font-bold">
                {assessments?.filter((a) => a.status === 'in_progress').length || 0}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          الكل
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
        >
          مكتمل
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          size="sm"
        >
          قيد التنفيذ
        </Button>
        <Button
          variant={filter === 'high-risk' ? 'default' : 'outline'}
          onClick={() => setFilter('high-risk')}
          size="sm"
        >
          مخاطر عالية
        </Button>
      </div>

      {/* Assessments List */}
      <div className="space-y-4">
        {filteredAssessments?.map((assessment) => (
          <Card
            key={assessment.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/grc/risk-assessments/${assessment.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    تقييم مخاطر - {assessment.vendor_id}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>تاريخ التقييم: {new Date(assessment.assessment_date).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={getStatusBadgeVariant(assessment.status)}>
                    {assessment.status === 'completed' ? 'مكتمل' :
                     assessment.status === 'in_progress' ? 'قيد التنفيذ' :
                     assessment.status === 'pending' ? 'معلق' : assessment.status}
                  </Badge>
                  {assessment.overall_risk_level && (
                    <Badge variant={getRiskBadgeVariant(assessment.overall_risk_level)}>
                      {assessment.overall_risk_level === 'critical' ? 'حرجة' :
                       assessment.overall_risk_level === 'high' ? 'عالية' :
                       assessment.overall_risk_level === 'medium' ? 'متوسطة' :
                       assessment.overall_risk_level === 'low' ? 'منخفضة' : 'غير محددة'}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">الدرجة الإجمالية</p>
                    <p className="text-lg font-bold">
                      {assessment.overall_risk_score || 0}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">مخاطر البيانات</p>
                    <p className="text-lg font-bold">
                      {assessment.data_security_score || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الامتثال</p>
                    <p className="text-lg font-bold">
                      {assessment.compliance_score || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الأداء المالي</p>
                    <p className="text-lg font-bold">
                      {assessment.financial_score || 0}
                    </p>
                  </div>
                </div>

                {assessment.key_findings && assessment.key_findings.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">النتائج الرئيسية:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {(assessment.key_findings as string[]).slice(0, 2).map((finding, idx) => (
                        <li key={idx}>• {finding}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <FileSearch className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      {filteredAssessments?.length === 0 && (
        <Card className="p-12 text-center">
          <FileSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد تقييمات</h3>
          <p className="text-muted-foreground mb-4">
            ابدأ بإنشاء تقييم مخاطر جديد للموردين
          </p>
          <Button onClick={() => navigate('/grc/risk-assessments/new')}>
            <Plus className="h-4 w-4 ml-2" />
            تقييم جديد
          </Button>
        </Card>
      )}
    </div>
  );
}
