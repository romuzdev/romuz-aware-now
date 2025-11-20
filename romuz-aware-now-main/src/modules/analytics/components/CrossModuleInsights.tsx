/**
 * Cross-Module Insights Component
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useModuleKPIGroups } from '../hooks/useUnifiedKPIs';
import { Badge } from '@/core/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import type { CrossModuleInsight } from '../types/unified-kpis.types';

export function CrossModuleInsights() {
  const { data: moduleGroups } = useModuleKPIGroups();

  if (!moduleGroups) return null;

  // Generate insights based on module correlations
  const insights: CrossModuleInsight[] = [];

  // Insight 1: Risk vs Compliance correlation
  const riskGroup = moduleGroups.find(g => g.module === 'risk');
  const complianceGroup = moduleGroups.find(g => g.module === 'compliance');
  
  if (riskGroup && complianceGroup) {
    if (riskGroup.criticalCount > 0 && complianceGroup.criticalCount > 0) {
      insights.push({
        title: 'ارتباط بين المخاطر والامتثال',
        description: `توجد ${riskGroup.criticalCount} مخاطر حرجة و ${complianceGroup.criticalCount} فجوات امتثال حرجة`,
        modules: ['risk', 'compliance'],
        impact: 'negative',
        recommendation: 'يُنصح بمراجعة العلاقة بين المخاطر الحرجة وفجوات الامتثال لتحديد الأولويات'
      });
    }
  }

  // Insight 2: Campaign effectiveness
  const campaignGroup = moduleGroups.find(g => g.module === 'campaign');
  if (campaignGroup && campaignGroup.achievementRate > 80) {
    insights.push({
      title: 'أداء ممتاز للحملات التوعوية',
      description: `معدل إنجاز الحملات ${campaignGroup.achievementRate.toFixed(0)}%`,
      modules: ['campaign'],
      impact: 'positive',
      recommendation: 'استمر في نفس النهج وشارك أفضل الممارسات مع الفرق الأخرى'
    });
  }

  // Insight 3: Audit completion
  const auditGroup = moduleGroups.find(g => g.module === 'audit');
  if (auditGroup && auditGroup.avgPerformance < 50) {
    insights.push({
      title: 'تأخر في إنجاز عمليات التدقيق',
      description: `متوسط التقدم ${auditGroup.avgPerformance.toFixed(0)}%`,
      modules: ['audit'],
      impact: 'negative',
      recommendation: 'مراجعة الموارد المخصصة للتدقيق وإعادة تحديد الأولويات'
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          رؤى متقاطعة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            لا توجد رؤى متاحة حالياً
          </p>
        ) : (
          insights.map((insight, idx) => (
            <div key={idx} className="border-r-4 border-primary/20 pr-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  {insight.impact === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  {insight.title}
                </h4>
                <Badge variant={insight.impact === 'positive' ? 'default' : 'destructive'}>
                  {insight.impact === 'positive' ? 'إيجابي' : 'سلبي'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
              <p className="text-sm bg-muted p-2 rounded">
                💡 {insight.recommendation}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
