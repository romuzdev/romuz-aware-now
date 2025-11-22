/**
 * Risk Trends Page
 * Historical trends and patterns in risk data
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useRisks } from '@/modules/grc/hooks';
import { RiskTrendsChart } from '../components';

export default function RiskTrends() {
  const { data: risks, isLoading } = useRisks();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">اتجاهات المخاطر</h1>
        <p className="text-muted-foreground">
          تحليل الاتجاهات التاريخية والأنماط في بيانات المخاطر
        </p>
      </div>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>اتجاهات المخاطر الزمنية</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              جاري التحميل...
            </div>
          ) : (
            <RiskTrendsChart />
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>رؤى رئيسية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <p className="font-medium">اتجاه المخاطر</p>
                <p className="text-sm text-muted-foreground">
                  تحليل الاتجاه العام لمستويات المخاطر عبر الزمن
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-medium">الفئات الأكثر تأثراً</p>
                <p className="text-sm text-muted-foreground">
                  تحديد فئات المخاطر التي شهدت أكبر التغيرات
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-medium">فعالية المعالجة</p>
                <p className="text-sm text-muted-foreground">
                  قياس مدى نجاح خطط معالجة المخاطر
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توصيات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="font-medium text-sm">مراجعة دورية</p>
                  <p className="text-xs text-muted-foreground">
                    إجراء مراجعات منتظمة للمخاطر عالية التأثير
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="font-medium text-sm">تعزيز الضوابط</p>
                  <p className="text-xs text-muted-foreground">
                    تحسين الضوابط للفئات ذات الاتجاه التصاعدي
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="font-medium text-sm">مشاركة الدروس المستفادة</p>
                  <p className="text-xs text-muted-foreground">
                    نشر أفضل الممارسات من المعالجات الناجحة
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
