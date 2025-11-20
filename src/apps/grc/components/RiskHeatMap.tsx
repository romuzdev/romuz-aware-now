/**
 * Risk Heat Map Component
 * Interactive risk heat map visualization
 */

import React from 'react';
import { useHeatMapData } from '@/modules/grc/hooks/useReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const RiskHeatMap: React.FC = () => {
  const { data: heatMapData, isLoading, error } = useHeatMapData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            خطأ في تحميل خريطة المخاطر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  // Create 5x5 grid
  const grid = Array.from({ length: 5 }, (_, likelihood) =>
    Array.from({ length: 5 }, (_, impact) => {
      const cellData = heatMapData?.find(
        d => d.likelihood === likelihood + 1 && d.impact === impact + 1
      );
      return cellData || { likelihood: likelihood + 1, impact: impact + 1, count: 0, risks: [] };
    })
  );

  const getCellColor = (likelihood: number, impact: number): string => {
    const score = likelihood * impact;
    if (score >= 20) return 'bg-red-500 hover:bg-red-600';
    if (score >= 15) return 'bg-orange-500 hover:bg-orange-600';
    if (score >= 8) return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-green-500 hover:bg-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>خريطة المخاطر الحرارية</CardTitle>
        <CardDescription>
          توزيع المخاطر حسب الاحتمالية والتأثير
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Y-axis label (Impact) */}
          <div className="flex items-center gap-4">
            <div className="w-20 text-sm font-medium text-right">التأثير</div>
            <div className="flex-1">
              {/* Heat map grid */}
              <div className="grid grid-cols-5 gap-2">
                {grid.reverse().map((row, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                          aspect-square rounded-md transition-all cursor-pointer
                          ${getCellColor(cell.likelihood, cell.impact)}
                          ${cell.count > 0 ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-50'}
                        `}
                        title={`احتمالية: ${cell.likelihood}, تأثير: ${cell.impact}\nعدد المخاطر: ${cell.count}`}
                      >
                        <div className="h-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {cell.count > 0 ? cell.count : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* X-axis label (Likelihood) */}
          <div className="flex items-center gap-4">
            <div className="w-20"></div>
            <div className="flex-1 text-center text-sm font-medium">
              الاحتمالية
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">منخفض (1-7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm">متوسط (8-14)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span className="text-sm">مرتفع (15-19)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm">حرج (20-25)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
