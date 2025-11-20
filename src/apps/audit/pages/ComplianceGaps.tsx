/**
 * Compliance Gaps Page
 * M12: Analyze compliance gaps from audit findings
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useAudits } from '@/modules/grc';
import { ComplianceGapAnalysis } from '@/modules/grc/components/audit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';

export default function ComplianceGaps() {
  const [selectedAuditId, setSelectedAuditId] = useState<string>('');
  const { data: audits, isLoading } = useAudits({ audit_type: 'compliance' });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">تحليل فجوات الامتثال</h1>
        <p className="text-muted-foreground">
          تحليل الفجوات بين الوضع الحالي ومتطلبات الامتثال
        </p>
      </div>

      {/* Audit Selection */}
      <Card>
        <CardHeader>
          <CardTitle>اختر مراجعة امتثال</CardTitle>
          <CardDescription>
            اختر مراجعة لتحليل الفجوات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            onValueChange={setSelectedAuditId}
            value={selectedAuditId}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر مراجعة" />
            </SelectTrigger>
            <SelectContent>
              {audits?.map((audit) => (
                <SelectItem key={audit.id} value={audit.id}>
                  {audit.audit_code} - {audit.audit_title_ar || audit.audit_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Gap Analysis */}
      {selectedAuditId && (
        <ComplianceGapAnalysis auditId={selectedAuditId} />
      )}

      {!selectedAuditId && audits && audits.length > 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">اختر مراجعة لتحليل الفجوات</p>
          </CardContent>
        </Card>
      )}

      {!selectedAuditId && (!audits || audits.length === 0) && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">لا توجد عمليات تدقيق متاحة</p>
            <p className="text-sm text-muted-foreground">
              قم بإنشاء عملية تدقيق امتثال أولاً من صفحة خطط التدقيق
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
