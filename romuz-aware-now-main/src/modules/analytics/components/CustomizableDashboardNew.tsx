/**
 * M14 Enhancement - Fully Customizable Drag & Drop Dashboard
 */

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/core/components/ui/dialog';
import { Save, RotateCcw, Grid, List, Library } from 'lucide-react';
import { toast } from 'sonner';
import { DraggableWidget } from './DraggableWidget';
import { WidgetLibrary } from './WidgetLibrary';
import { ExecutiveSummaryCard } from './ExecutiveSummaryCard';
import { KPIAlertCenter } from './KPIAlertCenter';
import { HistoricalComparisonChart } from './HistoricalComparisonChart';
import { RealTimeWidget } from './RealTimeWidget';
import { CrossModuleInsights } from './CrossModuleInsights';
import { DetailedAlertsPanel } from './DetailedAlertsPanel';
import { useDefaultLayout, useSaveDashboardLayout } from '../hooks/useDashboardLayout';
import type { DashboardWidget, WidgetType } from '../types/custom-kpi.types';

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'exec-1', type: 'executive-summary', title: 'الملخص التنفيذي', visible: true, order: 0, size: 'large' },
  { id: 'alerts-1', type: 'alerts', title: 'مركز التنبيهات', visible: true, order: 1, size: 'medium' },
  { id: 'historical-1', type: 'historical-chart', title: 'الاتجاهات التاريخية', visible: true, order: 2, size: 'large' }
];

export function CustomizableDashboardNew() {
  const { data: savedLayout, isLoading } = useDefaultLayout();
  const saveMutation = useSaveDashboardLayout();
  
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Load saved layout
  useEffect(() => {
    if (savedLayout) {
      setWidgets(savedLayout.widgets);
      setLayout(savedLayout.grid_layout);
    }
  }, [savedLayout]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order
    const reordered = items.map((item, index) => ({ ...item, order: index }));
    setWidgets(reordered);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  const handleAddWidget = (widgetType: WidgetType, size: 'small' | 'medium' | 'large') => {
    const newWidget: DashboardWidget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: widgetType,
      visible: true,
      order: widgets.length,
      size
    };
    setWidgets(prev => [...prev, newWidget]);
    setIsLibraryOpen(false);
    toast.success('تم إضافة العنصر');
  };

  const handleSaveLayout = () => {
    saveMutation.mutate({
      widgets,
      grid_layout: layout,
      is_default: true
    });
  };

  const handleResetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    setLayout('grid');
    toast.success('تم إعادة تعيين التخطيط');
  };

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'executive-summary':
        return <ExecutiveSummaryCard />;
      case 'alerts':
        return <KPIAlertCenter />;
      case 'historical-chart':
        return <HistoricalComparisonChart periodDays={30} />;
      case 'real-time':
        return (
          <RealTimeWidget
            title="مؤشر حي"
            value={85}
            target={100}
            unit="%"
            trend={{ value: 5, direction: 'up' }}
            status="success"
          />
        );
      case 'cross-module-insights':
        return <CrossModuleInsights />;
      case 'detailed-alerts':
        return <DetailedAlertsPanel />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">تخطيط اللوحة</h3>
              <Badge variant="secondary">{widgets.length} عنصر</Badge>
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

              {/* Widget Library */}
              <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Library className="h-4 w-4" />
                    إضافة عنصر
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>مكتبة العناصر</DialogTitle>
                    <DialogDescription>
                      اختر العناصر التي تريد إضافتها إلى لوحتك
                    </DialogDescription>
                  </DialogHeader>
                  <WidgetLibrary
                    onWidgetAdd={handleAddWidget}
                    activeWidgets={widgets.map(w => w.type)}
                  />
                </DialogContent>
              </Dialog>

              {/* Save/Reset */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveLayout}
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                حفظ
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetLayout}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drag & Drop Area */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard" direction={layout === 'grid' ? 'horizontal' : 'vertical'}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={
                layout === 'grid'
                  ? 'grid grid-cols-1 lg:grid-cols-2 gap-4'
                  : 'space-y-4'
              }
            >
              {widgets
                .filter(w => w.visible)
                .sort((a, b) => a.order - b.order)
                .map((widget, index) => (
                  <DraggableWidget
                    key={widget.id}
                    id={widget.id}
                    index={index}
                    title={widget.title}
                    onRemove={() => handleRemoveWidget(widget.id)}
                    size={widget.size}
                  >
                    {renderWidget(widget)}
                  </DraggableWidget>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Empty State */}
      {widgets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              لا توجد عناصر في اللوحة. ابدأ بإضافة عناصر من المكتبة!
            </p>
            <Button onClick={() => setIsLibraryOpen(true)}>
              <Library className="h-4 w-4 ml-2" />
              فتح مكتبة العناصر
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
