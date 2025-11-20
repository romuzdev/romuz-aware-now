/**
 * Advanced KPI Filters
 * M14 Enhancement: Advanced filtering for KPI dashboard
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Label } from '@/core/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Slider } from '@/core/components/ui/slider';
import { Switch } from '@/core/components/ui/switch';
import { Filter, X, Calendar, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedDashboardFilters, KPIModule } from '../types/unified-kpis.types';

interface AdvancedKPIFiltersProps {
  filters: UnifiedDashboardFilters;
  onFiltersChange: (filters: UnifiedDashboardFilters) => void;
  availableModules?: KPIModule[];
  className?: string;
}

export function AdvancedKPIFilters({
  filters,
  onFiltersChange,
  availableModules = [],
  className,
}: AdvancedKPIFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<UnifiedDashboardFilters>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsExpanded(false);
  };

  const handleResetFilters = () => {
    const resetFilters: UnifiedDashboardFilters = {};
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key as keyof UnifiedDashboardFilters] !== undefined
  ).length;

  const updateFilter = <K extends keyof UnifiedDashboardFilters>(
    key: K,
    value: UnifiedDashboardFilters[K]
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              فلاتر متقدمة
            </CardTitle>
            <CardDescription>
              تخصيص عرض مؤشرات الأداء
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} فلتر نشط
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'إخفاء' : 'إظهار'}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Module Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              الموديولات
            </Label>
            <Select
              value={localFilters.modules?.[0] || 'all'}
              onValueChange={(value) => 
                updateFilter('modules', value === 'all' ? undefined : [value as KPIModule])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الموديول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموديولات</SelectItem>
                {availableModules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Period Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              الفترة الزمنية
            </Label>
            <Select
              value={localFilters.period || '30d'}
              onValueChange={(value) => updateFilter('period', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">آخر 7 أيام</SelectItem>
                <SelectItem value="30d">آخر 30 يوم</SelectItem>
                <SelectItem value="90d">آخر 90 يوم</SelectItem>
                <SelectItem value="ytd">من بداية العام</SelectItem>
                <SelectItem value="1y">السنة الماضية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Achievement Filter */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              نسبة الإنجاز (%)
            </Label>
            <div className="space-y-4">
              <Slider
                value={[localFilters.minAchievement || 0]}
                onValueChange={(value) => updateFilter('minAchievement', value[0])}
                min={0}
                max={100}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0%</span>
                <Badge variant="outline">
                  الحد الأدنى: {localFilters.minAchievement || 0}%
                </Badge>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Critical Only Filter */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <div>
                <Label htmlFor="critical-only" className="cursor-pointer">
                  عرض المؤشرات الحرجة فقط
                </Label>
                <p className="text-xs text-muted-foreground">
                  إظهار المؤشرات التي تحتاج إلى اهتمام فوري
                </p>
              </div>
            </div>
            <Switch
              id="critical-only"
              checked={localFilters.criticalOnly || false}
              onCheckedChange={(checked) => updateFilter('criticalOnly', checked)}
            />
          </div>

          {/* Below Target Filter */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              <div>
                <Label htmlFor="below-target" className="cursor-pointer">
                  عرض ما دون الهدف فقط
                </Label>
                <p className="text-xs text-muted-foreground">
                  إظهار المؤشرات التي لم تحقق الهدف المطلوب
                </p>
              </div>
            </div>
            <Switch
              id="below-target"
              checked={localFilters.belowTarget || false}
              onCheckedChange={(checked) => updateFilter('belowTarget', checked)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleApplyFilters} className="flex-1">
              <Filter className="h-4 w-4 ml-2" />
              تطبيق الفلاتر
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              <X className="h-4 w-4 ml-2" />
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
