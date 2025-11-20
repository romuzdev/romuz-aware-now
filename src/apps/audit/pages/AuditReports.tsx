/**
 * Audit Reports Page
 * M12: Generate and manage audit reports
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useAudits } from '@/modules/grc';
import { AuditReportGenerator } from '@/modules/grc/components/audit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';

export default function AuditReports() {
  const [selectedAuditId, setSelectedAuditId] = useState<string>('');
  const { data: audits, isLoading } = useAudits({ sortBy: 'created_at', sortDir: 'desc' });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">تقارير التدقيق</h1>
        <p className="text-muted-foreground">
          إنشاء وتصدير تقارير التدقيق بصيغ متعددة
        </p>
      </div>

      {/* Audit Selection */}
      <Card>
        <CardHeader>
          <CardTitle>اختر عملية تدقيق</CardTitle>
          <CardDescription>
            اختر عملية تدقيق لإنشاء تقرير
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            onValueChange={setSelectedAuditId}
            value={selectedAuditId}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر عملية تدقيق" />
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

      {/* Report Generator */}
      {selectedAuditId && (
        <AuditReportGenerator auditId={selectedAuditId} />
      )}

      {!selectedAuditId && audits && audits.length > 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">اختر عملية تدقيق لإنشاء تقرير</p>
          </CardContent>
        </Card>
      )}

      {!selectedAuditId && (!audits || audits.length === 0) && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">لا توجد عمليات تدقيق متاحة</p>
            <p className="text-sm text-muted-foreground">
              قم بإنشاء عملية تدقيق أولاً من صفحة خطط التدقيق
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
