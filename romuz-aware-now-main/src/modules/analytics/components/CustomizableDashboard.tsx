/**
 * M14 - Customizable Dashboard
 * Drag & drop widget builder for KPI dashboard
 * Note: Full drag-drop requires external library - this is a simplified version
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Plus, Grid, List, Save } from 'lucide-react';
import { RealTimeWidget } from './RealTimeWidget';
import { ExecutiveSummaryCard } from './ExecutiveSummaryCard';
import { HistoricalComparisonChart } from './HistoricalComparisonChart';
import { KPIAlertCenter } from './KPIAlertCenter';
import { toast } from 'sonner';

type WidgetType = 'executive-summary' | 'alerts' | 'historical-chart' | 'real-time';

interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
  order: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'exec-summary', type: 'executive-summary', title: 'الملخص التنفيذي', visible: true, order: 0 },
  { id: 'alerts', type: 'alerts', title: 'مركز التنبيهات', visible: true, order: 1 },
  { id: 'historical-30d', type: 'historical-chart', title: 'المقارنة التاريخية (30 يوم)', visible: true, order: 2 },
];

export function CustomizableDashboard() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const handleToggleWidget = (widgetId: string) => {
    setWidgets(prev =>
      prev.map(w =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
    );
  };

  const handleSaveLayout = () => {
    // Save to localStorage or backend
    localStorage.setItem('kpi-dashboard-layout', JSON.stringify({ widgets, layout }));
    toast.success('تم حفظ تخطيط اللوحة');
  };

  const handleResetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    setLayout('grid');
    localStorage.removeItem('kpi-dashboard-layout');
    toast.success('تم إعادة تعيين التخطيط');
  };

  const renderWidget = (widget: WidgetConfig) => {
    if (!widget.visible) return null;

    switch (widget.type) {
      case 'executive-summary':
        return <ExecutiveSummaryCard key={widget.id} />;
      case 'alerts':
        return <KPIAlertCenter key={widget.id} />;
      case 'historical-chart':
        return <HistoricalComparisonChart key={widget.id} periodDays={30} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">تخطيط اللوحة</h3>
              <Badge variant="secondary">{widgets.filter(w => w.visible).length} عنصر نشط</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Layout Toggle */}
              <Button
                variant={layout === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayout('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={layout === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayout('list')}
              >
                <List className="h-4 w-4" />
              </Button>

              {/* Save/Reset */}
              <Button variant="outline" size="sm" onClick={handleSaveLayout}>
                <Save className="h-4 w-4 ml-2" />
                حفظ
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetLayout}>
                إعادة تعيين
              </Button>
            </div>
          </div>

          {/* Widget Selection */}
          <div className="flex flex-wrap gap-2 mt-4">
            {widgets.map(widget => (
              <Button
                key={widget.id}
                variant={widget.visible ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleToggleWidget(widget.id)}
              >
                {widget.visible ? '✓ ' : ''}
                {widget.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Widgets Grid */}
      <div className={layout === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
        {widgets
          .filter(w => w.visible)
          .sort((a, b) => a.order - b.order)
          .map(widget => renderWidget(widget))}
      </div>

      {/* Empty State */}
      {widgets.filter(w => w.visible).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              لا توجد عناصر نشطة. اختر عنصراً من الأعلى لإضافته.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
