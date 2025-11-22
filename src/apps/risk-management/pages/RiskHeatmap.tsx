/**
 * Risk Heatmap Page
 * Interactive risk matrix visualization
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useRisks } from '@/modules/grc/hooks';
import { RiskMatrix } from '../components';
import { useNavigate } from 'react-router-dom';

export default function RiskHeatmap() {
  const navigate = useNavigate();
  const { data: risks, isLoading } = useRisks();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">خريطة المخاطر الحرارية</h1>
        <p className="text-muted-foreground">
          عرض تفاعلي لتوزيع المخاطر حسب الاحتمالية والتأثير
        </p>
      </div>

      {/* Risk Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>مصفوفة المخاطر</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              جاري التحميل...
            </div>
          ) : risks && risks.length > 0 ? (
            <RiskMatrix
              risks={risks}
              onRiskClick={(risk) => navigate(`/risk/register/${risk.id}`)}
            />
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              لا توجد مخاطر لعرضها
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>دليل الألوان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-sm">منخفضة (1-4)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded" />
              <span className="text-sm">متوسطة (5-9)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded" />
              <span className="text-sm">عالية (10-15)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span className="text-sm">حرجة (16-25)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
