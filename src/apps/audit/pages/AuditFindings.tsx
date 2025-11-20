/**
 * Audit Findings Page
 * M12: Track and manage audit findings with categorization
 */

import { useState } from 'react';
import { Card, CardContent } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { useAuditFindings, useAudits, type AuditFindingFilters } from '@/modules/grc';
import { FindingTracker, FindingsCategorization } from '@/modules/grc/components/audit';
import { Input } from '@/core/components/ui/input';
import { Search } from 'lucide-react';

export default function AuditFindings() {
  const [filters, setFilters] = useState<AuditFindingFilters>({});
  const { data: findings, isLoading } = useAuditFindings(filters);
  const { data: audits } = useAudits({ sortBy: 'created_at', sortDir: 'desc' });

  // Get unique audit for findings display
  const selectedAuditId = findings && findings.length > 0 ? findings[0].audit_id : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">نتائج التدقيق</h1>
        <p className="text-muted-foreground">
          متابعة وإدارة نتائج وملاحظات التدقيق
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="البحث في الملاحظات..."
          className="pr-10"
          value={filters.q || ''}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
      </div>

      {/* Findings Tabs */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : selectedAuditId ? (
        <Tabs defaultValue="categorization" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categorization">التصنيف والإدارة</TabsTrigger>
            <TabsTrigger value="tracker">متابعة الملاحظات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categorization" className="mt-6">
            <FindingsCategorization auditId={selectedAuditId} />
          </TabsContent>
          
          <TabsContent value="tracker" className="mt-6">
            <FindingTracker auditId={selectedAuditId} />
          </TabsContent>
        </Tabs>
      ) : audits && audits.length > 0 ? (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">لا توجد ملاحظات تدقيق حتى الآن</p>
            <p className="text-sm text-muted-foreground">
              سيتم عرض الملاحظات هنا بمجرد إضافتها أثناء عمليات التدقيق
            </p>
          </CardContent>
        </Card>
      ) : (
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
