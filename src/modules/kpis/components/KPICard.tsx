/**
 * KPI Card Component
 * Gate-I: KPIs Module
 */

import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import type { KPI } from '../types';

interface KPICardProps {
  kpi: KPI;
  onClick?: () => void;
}

export function KPICard({ kpi, onClick }: KPICardProps) {
  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-accent transition-colors" 
      onClick={onClick}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{kpi.nameAr}</h3>
          <p className="text-xs text-muted-foreground mt-1">{kpi.kpiKey}</p>
          {kpi.descriptionAr && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {kpi.descriptionAr}
            </p>
          )}
        </div>
        <Badge variant={kpi.isActive ? 'default' : 'secondary'}>
          {kpi.isActive ? 'نشط' : 'غير نشط'}
        </Badge>
      </div>
      
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span>التصنيف: {kpi.category}</span>
        {kpi.unit && <span>الوحدة: {kpi.unit}</span>}
        {kpi.targetValue && <span>الهدف: {kpi.targetValue}</span>}
      </div>
    </Card>
  );
}
