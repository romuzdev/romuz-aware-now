/**
 * GRC Control Dashboard Page
 * Overview and analytics for control management
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useControlStatistics, useControlTestStatistics, useControlTests, useControls } from '@/modules/grc';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Shield, Activity } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';

export function ControlDashboard() {
  const { data: controlStats, isLoading: loadingControlStats } = useControlStatistics();
  const { data: testStats, isLoading: loadingTestStats } = useControlTestStatistics();
  const { data: recentTests } = useControlTests({ sortBy: 'test_date', sortDir: 'desc' });
  const { data: overdueControls } = useControls({
    sortBy: 'next_test_date',
    sortDir: 'asc',
  });

  const overdueTestsCount = overdueControls?.filter(
    (c) => c.next_test_date && new Date(c.next_test_date) < new Date()
  ).length || 0;

  if (loadingControlStats || loadingTestStats) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">لوحة قيادة الضوابط الرقابية</h1>
        <p className="text-muted-foreground">نظرة عامة على حالة الضوابط والاختبارات</p>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الضوابط</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{controlStats?.total_controls || 0}</div>
            <p className="text-xs text-muted-foreground">
              {controlStats?.active_controls || 0} نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">متوسط الفعالية</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {controlStats?.average_effectiveness_score.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">من 100%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الاختبارات هذا الشهر</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testStats?.tests_this_month || 0}</div>
            <p className="text-xs text-muted-foreground">
              معدل النجاح: {testStats?.pass_rate.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">اختبارات متأخرة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTestsCount}</div>
            <p className="text-xs text-muted-foreground">تحتاج اختبار فوري</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>توزيع الضوابط حسب النوع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">وقائية</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${
                        ((controlStats?.by_type.preventive || 0) /
                          (controlStats?.total_controls || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-left">
                  {controlStats?.by_type.preventive || 0}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">كاشفة</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${
                        ((controlStats?.by_type.detective || 0) /
                          (controlStats?.total_controls || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-left">
                  {controlStats?.by_type.detective || 0}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">تصحيحية</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${
                        ((controlStats?.by_type.corrective || 0) /
                          (controlStats?.total_controls || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-left">
                  {controlStats?.by_type.corrective || 0}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">توجيهية</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${
                        ((controlStats?.by_type.directive || 0) /
                          (controlStats?.total_controls || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-left">
                  {controlStats?.by_type.directive || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مستويات الفعالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">فعال جداً</span>
              <div className="flex items-center gap-2">
                <Badge variant="default">{controlStats?.by_effectiveness.highly_effective || 0}</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">فعال</span>
              <div className="flex items-center gap-2">
                <Badge variant="default">{controlStats?.by_effectiveness.effective || 0}</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">فعال جزئياً</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {controlStats?.by_effectiveness.partially_effective || 0}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">غير فعال</span>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">
                  {controlStats?.by_effectiveness.ineffective || 0}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">لم يتم الاختبار</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {controlStats?.by_effectiveness.not_tested || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results Overview */}
      <Card>
        <CardHeader>
          <CardTitle>نتائج الاختبارات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {testStats?.by_result.passed || 0}
              </div>
              <p className="text-sm text-muted-foreground">نجح</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {testStats?.by_result.passed_with_exceptions || 0}
              </div>
              <p className="text-sm text-muted-foreground">نجح مع استثناءات</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {testStats?.by_result.failed || 0}
              </div>
              <p className="text-sm text-muted-foreground">فشل</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {testStats?.by_result.not_applicable || 0}
              </div>
              <p className="text-sm text-muted-foreground">غير قابل للتطبيق</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remediation Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">يحتاج إصلاح</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testStats?.requiring_remediation || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">تم الإصلاح</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {testStats?.remediation_completed || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">متأخر</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {testStats?.remediation_overdue || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tests */}
      <Card>
        <CardHeader>
          <CardTitle>الاختبارات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>النتيجة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTests?.slice(0, 5).map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.test_code}</TableCell>
                  <TableCell>{test.test_title}</TableCell>
                  <TableCell>{new Date(test.test_date).toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        test.test_result === 'passed'
                          ? 'default'
                          : test.test_result === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {test.test_result === 'passed' && 'نجح'}
                      {test.test_result === 'passed_with_exceptions' && 'نجح مع استثناءات'}
                      {test.test_result === 'failed' && 'فشل'}
                      {test.test_result === 'not_applicable' && 'غير قابل للتطبيق'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!recentTests || recentTests.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    لا توجد اختبارات حديثة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
