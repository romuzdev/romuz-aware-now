/**
 * GRC Compliance Dashboard
 */

import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import { CheckCircle2, AlertCircle, Shield, Target, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useComplianceStatistics, useComplianceFrameworks, useAudits } from '@/modules/grc';

export default function ComplianceDashboard() {
  const { data: statistics } = useComplianceStatistics();
  const { data: frameworks } = useComplianceFrameworks({ framework_status: 'active', limit: 10 });
  const { data: audits } = useAudits({ sortBy: 'planned_start_date', sortDir: 'desc', limit: 5 });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة معلومات الامتثال</h1>
          <p className="text-muted-foreground">نظرة عامة على حالة الامتثال</p>
        </div>
        <Button asChild><Link to="/grc/frameworks">مكتبة الأطر</Link></Button>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">مستوى الامتثال الإجمالي</h3>
        <div className="text-4xl font-bold text-green-600 mb-2">{statistics?.avg_compliance_score || 0}%</div>
        <Progress value={statistics?.avg_compliance_score || 0} className="h-3" />
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-muted-foreground">إجمالي المتطلبات</span>
          </div>
          <div className="text-2xl font-bold">{statistics?.total_requirements || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm text-muted-foreground">ممتثل</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{statistics?.compliant_requirements || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-muted-foreground">غير ممتثل</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{statistics?.non_compliant_requirements || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-orange-600" />
            <span className="text-sm text-muted-foreground">الأطر النشطة</span>
          </div>
          <div className="text-2xl font-bold">{statistics?.active_frameworks || 0}</div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">الأطر النشطة</h3>
          <div className="space-y-3">
            {frameworks?.map((fw) => (
              <Link key={fw.id} to={`/grc/frameworks/${fw.id}`} className="flex justify-between p-3 border rounded hover:bg-muted/50">
                <span>{fw.framework_name_ar || fw.framework_name}</span>
                <span className="font-bold text-green-600">{fw.overall_compliance_score || 0}%</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">التدقيقات الأخيرة</h3>
          <div className="space-y-3">
            {audits?.map((audit) => (
              <Link key={audit.id} to={`/grc/audits/${audit.id}`} className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50">
                <FileCheck className="h-5 w-5 text-blue-600" />
                <span>{audit.audit_title_ar || audit.audit_title}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
