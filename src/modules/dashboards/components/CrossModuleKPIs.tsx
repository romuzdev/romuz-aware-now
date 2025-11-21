/**
 * M14 - Cross Module KPIs Component
 * Display KPIs grouped by module with drill-down capability
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { Shield, FileCheck, Target, Users, Book, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrossModuleKPIsProps {
  period: '7d' | '30d' | '90d' | 'ytd' | '1y';
  refreshKey?: number;
}

export function CrossModuleKPIs({ period, refreshKey }: CrossModuleKPIsProps) {
  const { t } = useTranslation();

  // TODO: Replace with real data from unified_kpis view
  const moduleKPIs = [
    {
      module: 'risk',
      name: t('modules.risk', 'إدارة المخاطر'),
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      kpis: [
        { name: 'المخاطر الحرجة', current: 3, target: 0, status: 'critical' },
        { name: 'المخاطر المعالجة', current: 45, target: 50, status: 'warning' },
        { name: 'معدل التغطية', current: 87, target: 95, status: 'good' },
      ],
      avgPerformance: 78,
    },
    {
      module: 'compliance',
      name: t('modules.compliance', 'الامتثال'),
      icon: FileCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      kpis: [
        { name: 'معدل الامتثال', current: 94, target: 90, status: 'good' },
        { name: 'السياسات المحدثة', current: 38, target: 40, status: 'good' },
        { name: 'الفجوات المفتوحة', current: 5, target: 0, status: 'warning' },
      ],
      avgPerformance: 92,
    },
    {
      module: 'campaign',
      name: t('modules.campaigns', 'الحملات التوعوية'),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      kpis: [
        { name: 'نسبة الإنجاز', current: 76, target: 80, status: 'good' },
        { name: 'معدل المشاركة', current: 68, target: 75, status: 'warning' },
        { name: 'الحملات النشطة', current: 12, target: 15, status: 'good' },
      ],
      avgPerformance: 72,
    },
    {
      module: 'audit',
      name: t('modules.audit', 'التدقيق'),
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      kpis: [
        { name: 'عمليات التدقيق', current: 8, target: 10, status: 'good' },
        { name: 'النتائج المغلقة', current: 23, target: 30, status: 'warning' },
        { name: 'معدل الإصلاح', current: 85, target: 90, status: 'good' },
      ],
      avgPerformance: 82,
    },
    {
      module: 'objective',
      name: t('modules.objectives', 'الأهداف الاستراتيجية'),
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      kpis: [
        { name: 'الأهداف المنجزة', current: 7, target: 10, status: 'good' },
        { name: 'معدل التقدم', current: 70, target: 80, status: 'warning' },
        { name: 'المبادرات النشطة', current: 15, target: 20, status: 'good' },
      ],
      avgPerformance: 70,
    },
    {
      module: 'training',
      name: t('modules.training', 'التدريب'),
      icon: Book,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      kpis: [
        { name: 'معدل الإكمال', current: 82, target: 85, status: 'good' },
        { name: 'المتدربين النشطين', current: 245, target: 300, status: 'warning' },
        { name: 'الدورات المنتهية', current: 18, target: 20, status: 'good' },
      ],
      avgPerformance: 85,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-orange-500';
      case 'good': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {moduleKPIs.map((module) => {
        const Icon = module.icon;
        
        return (
          <Card key={module.module} className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', module.bgColor)}>
                    <Icon className={cn('h-5 w-5', module.color)} />
                  </div>
                  <CardTitle className="text-lg">{module.name}</CardTitle>
                </div>
                <Badge variant={module.avgPerformance >= 80 ? 'default' : 'secondary'}>
                  {module.avgPerformance}%
                </Badge>
              </div>
              <Progress value={module.avgPerformance} className="mt-3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {module.kpis.map((kpi, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">{kpi.name}</span>
                        <span className={cn('text-sm font-medium', getStatusColor(kpi.status))}>
                          {kpi.current} / {kpi.target}
                        </span>
                      </div>
                      <Progress 
                        value={(kpi.current / kpi.target) * 100} 
                        className="h-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
