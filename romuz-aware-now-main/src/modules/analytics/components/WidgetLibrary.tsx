/**
 * M14 Enhancement - Widget Library
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Plus, Activity, AlertTriangle, TrendingUp, BarChart, Lightbulb, Bell } from 'lucide-react';
import type { WidgetType } from '../types/custom-kpi.types';

interface WidgetDefinition {
  id: WidgetType;
  title: string;
  titleAr: string;
  description: string;
  icon: any;
  size: 'small' | 'medium' | 'large';
  category: 'analytics' | 'alerts' | 'insights';
}

const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    titleAr: 'الملخص التنفيذي',
    description: 'نظرة عامة على الأداء العام',
    icon: BarChart,
    size: 'large',
    category: 'analytics'
  },
  {
    id: 'alerts',
    title: 'Alert Center',
    titleAr: 'مركز التنبيهات',
    description: 'التنبيهات النشطة والحرجة',
    icon: AlertTriangle,
    size: 'medium',
    category: 'alerts'
  },
  {
    id: 'historical-chart',
    title: 'Historical Trends',
    titleAr: 'الاتجاهات التاريخية',
    description: 'مقارنة البيانات عبر الزمن',
    icon: TrendingUp,
    size: 'large',
    category: 'analytics'
  },
  {
    id: 'real-time',
    title: 'Real-Time Widget',
    titleAr: 'عنصر مباشر',
    description: 'بيانات حية ومحدثة',
    icon: Activity,
    size: 'small',
    category: 'analytics'
  },
  {
    id: 'cross-module-insights',
    title: 'Cross-Module Insights',
    titleAr: 'رؤى متقاطعة',
    description: 'تحليلات بين الموديولات',
    icon: Lightbulb,
    size: 'medium',
    category: 'insights'
  },
  {
    id: 'detailed-alerts',
    title: 'Detailed Alerts',
    titleAr: 'تنبيهات تفصيلية',
    description: 'عرض تفصيلي للتنبيهات',
    icon: Bell,
    size: 'large',
    category: 'alerts'
  }
];

interface WidgetLibraryProps {
  onWidgetAdd: (widgetType: WidgetType, size: 'small' | 'medium' | 'large') => void;
  activeWidgets: WidgetType[];
}

export function WidgetLibrary({ onWidgetAdd, activeWidgets }: WidgetLibraryProps) {
  const categories = [
    { id: 'analytics', label: 'التحليلات', color: 'default' },
    { id: 'alerts', label: 'التنبيهات', color: 'destructive' },
    { id: 'insights', label: 'الرؤى', color: 'secondary' }
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>مكتبة العناصر</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-6">
            {categories.map((category) => {
              const categoryWidgets = AVAILABLE_WIDGETS.filter(w => w.category === category.id);
              return (
                <div key={category.id}>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Badge variant={category.color}>{category.label}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {categoryWidgets.map((widget) => {
                      const Icon = widget.icon;
                      const isActive = activeWidgets.includes(widget.id);
                      return (
                        <div
                          key={widget.id}
                          className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm mb-1">{widget.titleAr}</div>
                              <p className="text-xs text-muted-foreground mb-2">{widget.description}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {widget.size === 'small' ? 'صغير' : widget.size === 'medium' ? 'متوسط' : 'كبير'}
                                </Badge>
                                {isActive && (
                                  <Badge variant="secondary" className="text-xs">
                                    مضاف
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={isActive ? 'secondary' : 'default'}
                              onClick={() => onWidgetAdd(widget.id, widget.size)}
                              disabled={isActive}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
