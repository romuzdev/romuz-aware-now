/**
 * M14 - Widget Library Component
 * Browse and select widgets for dashboard
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Badge } from '@/core/components/ui/badge';
import { useDashboardWidgets } from '@/modules/dashboards/hooks';
import { 
  BarChart3, 
  PieChart, 
  Activity, 
  TrendingUp, 
  Users, 
  FileText,
  Target,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetLibraryProps {
  selectedWidgets: string[];
  onSelectionChange: (widgets: string[]) => void;
}

const widgetIcons: Record<string, any> = {
  chart: BarChart3,
  pie: PieChart,
  metric: Activity,
  trend: TrendingUp,
  users: Users,
  document: FileText,
  target: Target,
  security: Shield,
};

export function WidgetLibrary({ selectedWidgets, onSelectionChange }: WidgetLibraryProps) {
  const { t } = useTranslation();
  const { data: widgets, isLoading } = useDashboardWidgets();

  const handleToggle = (widgetId: string) => {
    if (selectedWidgets.includes(widgetId)) {
      onSelectionChange(selectedWidgets.filter(id => id !== widgetId));
    } else {
      onSelectionChange([...selectedWidgets, widgetId]);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading', 'جاري التحميل...')}</div>;
  }

  // Group widgets by category
  const categories = Array.from(new Set(widgets?.map(w => w.category || 'other') || []));

  return (
    <div className="space-y-6">
      {categories.map(category => {
        const categoryWidgets = widgets?.filter(w => (w.category || 'other') === category) || [];
        
        return (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3 text-foreground">
              {t(`widget.category.${category}`, category)}
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryWidgets.map(widget => {
                const Icon = widgetIcons[widget.widget_type] || Activity;
                const isSelected = selectedWidgets.includes(widget.id);

                return (
                  <Card
                    key={widget.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      isSelected && 'ring-2 ring-primary'
                    )}
                    onClick={() => handleToggle(widget.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-medium">
                              {widget.name_ar}
                            </CardTitle>
                            {widget.is_system && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {t('widget.system', 'نظام')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(widget.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {widget.description_ar || t('widget.no_description', 'لا يوجد وصف')}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
