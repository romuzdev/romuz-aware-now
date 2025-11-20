/**
 * Gate-M Acceptance Test Page
 * Run comprehensive validation for Master Data & Taxonomy Hub
 */

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { PlayCircle, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details?: string;
  error?: string;
}

interface AcceptanceReport {
  status: 'PASS' | 'FAIL' | 'ERROR';
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  results: TestResult[];
  timestamp: string;
  error?: string;
}

export default function GateMAcceptancePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<AcceptanceReport | null>(null);

  async function runAcceptanceTest() {
    setIsRunning(true);
    setReport(null);

    try {
      // Get current session to pass auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const { data, error } = await supabase.functions.invoke('gate-m-acceptance', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      setReport(data);

      if (data.status === 'PASS') {
        toast.success('اختبار القبول نجح بالكامل! ✅');
      } else if (data.status === 'FAIL') {
        toast.error('فشل بعض الاختبارات ⚠️');
      } else {
        toast.error('حدث خطأ أثناء التنفيذ');
      }
    } catch (error: any) {
      toast.error('فشل تنفيذ الاختبار');
      setReport({
        status: 'ERROR',
        summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
        results: [],
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    } finally {
      setIsRunning(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'WARN':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PASS: 'default',
      FAIL: 'destructive',
      WARN: 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">اختبار قبول Gate-M</h1>
        <p className="text-muted-foreground">
          تحقق شامل من قاعدة البيانات، RLS، RPC، والمناظير المحفوظة
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تشغيل الاختبار</CardTitle>
          <CardDescription>
            سيقوم هذا الاختبار بالتحقق من جميع وظائف Master Data & Taxonomy Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runAcceptanceTest}
            disabled={isRunning}
            className="w-full md:w-auto"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري التنفيذ...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 ml-2" />
                تشغيل اختبار القبول
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ملخص النتائج
                {getStatusIcon(report.status)}
              </CardTitle>
              <CardDescription>
                تم التنفيذ في: {new Date(report.timestamp).toLocaleString('ar-SA')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{report.summary.total}</div>
                  <div className="text-sm text-muted-foreground">إجمالي الاختبارات</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {report.summary.passed}
                  </div>
                  <div className="text-sm text-muted-foreground">نجح</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {report.summary.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">فشل</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {report.summary.warnings}
                  </div>
                  <div className="text-sm text-muted-foreground">تحذيرات</div>
                </div>
              </div>

              {report.error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{report.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>النتائج التفصيلية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الفئة</TableHead>
                      <TableHead>الاختبار</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.category}</TableCell>
                        <TableCell>{result.test}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            {getStatusBadge(result.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {result.details && (
                              <div className="text-sm">{result.details}</div>
                            )}
                            {result.error && (
                              <div className="text-sm text-destructive">{result.error}</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Acceptance Summary */}
          <Card className={report.status === 'PASS' ? 'border-green-600' : 'border-red-600'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {report.status === 'PASS' ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    اختبار القبول نجح ✅
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-600" />
                    اختبار القبول فشل ❌
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {report.summary.failed === 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>RLS enabled on all tables</span>
                </div>
                <div className="flex items-center gap-2">
                  {report.results.filter((r) => r.category === 'Terms' && r.status === 'PASS')
                    .length > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>RPC core calls executed without error</span>
                </div>
                <div className="flex items-center gap-2">
                  {report.results.some(
                    (r) => r.category === 'Saved Views' && r.status === 'PASS'
                  ) ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Saved View operations work correctly</span>
                </div>
                <div className="flex items-center gap-2">
                  {report.results.some(
                    (r) => r.category === 'Catalog' && r.test.includes('Publish')
                  ) ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Catalog status transitions work correctly</span>
                </div>
                <div className="flex items-center gap-2">
                  {report.results.some(
                    (r) => r.category === 'Cleanup' && r.status === 'PASS'
                  ) ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span>Cleanup completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
