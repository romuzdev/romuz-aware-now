/**
 * M14 - Unified KPI Dashboard Page
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { useModuleKPIGroups, useKPIAlerts } from '@/modules/analytics/hooks/useUnifiedKPIs';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/core/components/ui/alert';
import { Badge } from '@/core/components/ui/badge';
import { Shield, CheckCircle, Users, FileCheck, Target, AlertTriangle, BookOpen, RefreshCw, Download } from 'lucide-react';
import { 
  HistoricalComparisonChart, 
  CrossModuleInsights, 
  DetailedAlertsPanel, 
  ExecutiveSummaryCard,
  KPIAlertCenter,
  CustomizableDashboard,
  CustomKPIFormulaBuilder,
  CustomizableDashboardNew,
  KPIComparisonPanel,
  KPITargetManager,
  AdvancedKPIFilters
} from '@/modules/analytics/components';
import { AIInsightsWidget } from '@/modules/ai-advisory/components';
import { exportKPIsToCSV, exportModuleGroupsToCSV, exportAlertsToCSV, exportToPDF } from '@/modules/analytics/utils/export.utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/core/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { UnifiedDashboardFilters } from '@/modules/analytics/types/unified-kpis.types';

const iconMap: Record<string, any> = {
  Shield, CheckCircle, Users, FileCheck, Target, BookOpen
};

export default function UnifiedDashboardPage() {
  const [filters, setFilters] = useState<UnifiedDashboardFilters>({});
  const { data: moduleGroups, isLoading: groupsLoading } = useModuleKPIGroups();
  const { data: alerts } = useKPIAlerts({ acknowledged: false });

  const handleExport = (type: 'csv-kpis' | 'csv-summary' | 'csv-alerts' | 'pdf') => {
    if (!moduleGroups) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    try {
      switch (type) {
        case 'csv-kpis':
          const allKPIs = moduleGroups.flatMap(g => g.kpis);
          exportKPIsToCSV(allKPIs);
          toast.success('تم تصدير المؤشرات بنجاح');
          break;
        case 'csv-summary':
          exportModuleGroupsToCSV(moduleGroups);
          toast.success('تم تصدير الملخص بنجاح');
          break;
        case 'csv-alerts':
          if (alerts) {
            exportAlertsToCSV(alerts);
            toast.success('تم تصدير التنبيهات بنجاح');
          }
          break;
        case 'pdf':
          exportToPDF(moduleGroups, alerts || []);
          toast.success('جاري إعداد ملف PDF');
          break;
      }
    } catch (error) {
      toast.error('فشل التصدير');
    }
  };

  if (groupsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة القيادة الموحدة</h1>
          <p className="text-muted-foreground mt-1">جميع مؤشرات الأداء في مكان واحد</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv-kpis')}>
                CSV - جميع المؤشرات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv-summary')}>
                CSV - ملخص الموديولات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv-alerts')}>
                CSV - التنبيهات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                PDF - تقرير شامل
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {alerts && alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تنبيهات هامة</AlertTitle>
          <AlertDescription>لديك {alerts.length} تنبيه يتطلب انتباهك</AlertDescription>
        </Alert>
      )}

      {/* Advanced Filters */}
      <AdvancedKPIFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableModules={moduleGroups?.map(g => g.module) || []}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {moduleGroups?.map((group) => {
          const Icon = iconMap[group.moduleIcon] || Target;
          return (
            <Card key={group.module}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4" />
                  {group.moduleName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{group.achievementRate.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {group.totalKPIs} مؤشر
                </p>
                {group.criticalCount > 0 && (
                  <Badge variant="destructive" className="mt-2">
                    {group.criticalCount} حرج
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="comparison">مقارنة</TabsTrigger>
          <TabsTrigger value="targets">الأهداف</TabsTrigger>
          <TabsTrigger value="executive">تنفيذي</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
          <TabsTrigger value="custom-kpi">مؤشرات مخصصة</TabsTrigger>
          <TabsTrigger value="customize">تخصيص متقدم</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CrossModuleInsights />
            <ExecutiveSummaryCard />
            <AIInsightsWidget maxItems={3} showStats={true} />
          </div>
          
          {moduleGroups?.map((group) => (
            <Card key={group.module}>
              <CardHeader>
                <CardTitle>{group.moduleName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.kpis.slice(0, 5).map((kpi) => (
                    <div key={kpi.kpi_key} className="flex justify-between items-center">
                      <span className="text-sm">{kpi.kpi_name}</span>
                      <Badge variant={kpi.current_value >= kpi.target_value ? 'default' : 'destructive'}>
                        {kpi.current_value.toFixed(0)} / {kpi.target_value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* KPI Comparison Tab - NEW */}
        <TabsContent value="comparison" className="space-y-4">
          <KPIComparisonPanel kpis={moduleGroups?.flatMap(g => g.kpis) || []} />
        </TabsContent>

        {/* KPI Targets Tab - NEW */}
        <TabsContent value="targets" className="space-y-4">
          <KPITargetManager 
            kpis={moduleGroups?.flatMap(g => g.kpis) || []}
            onUpdateTarget={async (kpiId, newTarget) => {
              toast.info('جاري تحديث الهدف...');
            }}
          />
        </TabsContent>

        <TabsContent value="executive" className="space-y-4">
          <ExecutiveSummaryCard />
          <HistoricalComparisonChart periodDays={30} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <KPIAlertCenter />
          <DetailedAlertsPanel />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <HistoricalComparisonChart periodDays={7} />
          <HistoricalComparisonChart periodDays={30} />
          <CrossModuleInsights />
        </TabsContent>

        <TabsContent value="custom-kpi" className="space-y-4">
          <CustomKPIFormulaBuilder />
        </TabsContent>

        <TabsContent value="customize" className="space-y-4">
          <CustomizableDashboardNew />
        </TabsContent>
      </Tabs>
    </div>
  );
}
