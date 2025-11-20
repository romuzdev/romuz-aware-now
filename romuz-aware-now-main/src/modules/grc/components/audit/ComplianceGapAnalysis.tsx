/**
 * Compliance Gap Analysis
 * M12: Analyze compliance gaps between current state and requirements
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Separator } from '@/core/components/ui/separator';
import { AlertTriangle, TrendingUp, CheckCircle, XCircle, Calendar, ArrowRight } from 'lucide-react';
import { useComplianceGapAnalysis } from '@/modules/grc/hooks/useAuditWorkflows';
import type { GapSeverity } from '@/modules/grc/types/compliance.types';

interface ComplianceGapAnalysisProps {
  auditId: string;
  frameworkId?: string;
}

const SEVERITY_LABELS: Record<GapSeverity, string> = {
  critical: 'حرجة',
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة',
};

const SEVERITY_COLORS: Record<GapSeverity, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-blue-500 text-white',
};

export function ComplianceGapAnalysis({ auditId, frameworkId }: ComplianceGapAnalysisProps) {
  const { data: gapAnalysis, isLoading } = useComplianceGapAnalysis(auditId, frameworkId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!gapAnalysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">لا توجد بيانات تحليل متاحة</p>
        </CardContent>
      </Card>
    );
  }

  const compliancePercentage = gapAnalysis.compliance_score;
  const gapsPercentage = 100 - compliancePercentage;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle>تحليل فجوات الامتثال</CardTitle>
          <CardDescription>
            تحليل الفجوات بين الوضع الحالي ومتطلبات إطار {gapAnalysis.framework_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Compliance Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">نسبة الامتثال الإجمالية</h3>
                <span className="text-3xl font-bold">{compliancePercentage}%</span>
              </div>
              <Progress value={compliancePercentage} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">إجمالي المتطلبات</p>
                  <p className="text-2xl font-bold">{gapAnalysis.total_requirements}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">المتطلبات المستوفاة</p>
                  <p className="text-2xl font-bold text-green-600">{gapAnalysis.compliant_requirements}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">الفجوات المحددة</p>
                  <p className="text-2xl font-bold text-red-600">{gapAnalysis.gaps_identified}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Risk Heat Map */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">خريطة المخاطر</h3>
              <div className="grid grid-cols-4 gap-4">
                {gapAnalysis.risk_heat_map?.map((item) => (
                  <Card key={item.severity}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={SEVERITY_COLORS[item.severity]}>
                            {SEVERITY_LABELS[item.severity]}
                          </Badge>
                          <span className="text-2xl font-bold">{item.count}</span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center">
                          {item.percentage}% من الفجوات
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gaps Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الفجوات</CardTitle>
          <CardDescription>
            قائمة مفصلة بجميع الفجوات المحددة مع الإجراءات الموصى بها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>المتطلب</TableHead>
                  <TableHead>الخطورة</TableHead>
                  <TableHead>الوضع الحالي</TableHead>
                  <TableHead>الوضع المستهدف</TableHead>
                  <TableHead>الجهد المقدر</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gapAnalysis.gaps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <p className="text-muted-foreground">
                          لم يتم العثور على فجوات! جميع المتطلبات مستوفاة.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  gapAnalysis.gaps.map((gap) => (
                    <TableRow key={gap.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-bold">
                          #{gap.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div>
                          <p className="font-medium">{gap.requirement_title_ar || gap.requirement_title}</p>
                          <p className="text-xs text-muted-foreground">{gap.requirement_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={SEVERITY_COLORS[gap.gap_severity]}>
                          {SEVERITY_LABELS[gap.gap_severity]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">{gap.current_status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{gap.target_status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{gap.estimated_effort_days} يوم</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <ArrowRight className="h-4 w-4 ml-2" />
                          التفاصيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Recommendations Summary */}
          {gapAnalysis.gaps.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-medium">الإجراءات الموصى بها (أعلى 5 أولويات)</h4>
              <div className="space-y-2">
                {gapAnalysis.gaps.slice(0, 5).map((gap, index) => (
                  <Card key={gap.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{gap.requirement_title_ar || gap.requirement_title}</p>
                            <Badge className={SEVERITY_COLORS[gap.gap_severity]}>
                              {SEVERITY_LABELS[gap.gap_severity]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {gap.gap_description_ar || gap.gap_description}
                          </p>
                          <div className="pt-2">
                            <p className="text-xs font-medium mb-1">الإجراءات المقترحة:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {gap.recommended_actions.map((action, i) => (
                                <li key={i} className="text-muted-foreground">{action}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
