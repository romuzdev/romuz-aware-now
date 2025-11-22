/**
 * M25 - Recommendations Panel Component
 */

import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { useHealthScore } from '../hooks';

export function RecommendationsPanel() {
  const { currentHealth } = useHealthScore();

  // Generate recommendations based on health scores
  const getRecommendations = () => {
    if (!currentHealth) return [];

    const recommendations = [];

    if (currentHealth.adoption_score < 50) {
      recommendations.push({
        id: 'adoption',
        priority: 'high',
        title: 'تحسين معدل التبني',
        description: 'معدل استخدام النظام منخفض. نوصي بإطلاق حملة توعية جديدة.',
        actionLabel: 'إنشاء حملة',
        actionUrl: '/awareness/campaigns/new',
      });
    }

    if (currentHealth.data_quality_score < 50) {
      recommendations.push({
        id: 'data_quality',
        priority: 'medium',
        title: 'تحسين جودة البيانات',
        description: 'العديد من السجلات تفتقر إلى المعلومات الأساسية.',
        actionLabel: 'مراجعة البيانات',
        actionUrl: '/policies',
      });
    }

    if (currentHealth.compliance_score < 50) {
      recommendations.push({
        id: 'compliance',
        priority: 'high',
        title: 'تعزيز الامتثال',
        description: 'يوجد نقص في السياسات النشطة أو المراجعات الدورية.',
        actionLabel: 'إدارة السياسات',
        actionUrl: '/policies',
      });
    }

    if (currentHealth.risk_hygiene_score < 50) {
      recommendations.push({
        id: 'risk',
        priority: 'critical',
        title: 'معالجة المخاطر',
        description: 'يوجد مخاطر لم يتم معالجتها بعد.',
        actionLabel: 'عرض المخاطر',
        actionUrl: '/grc/risks',
      });
    }

    return recommendations.slice(0, 3);
  };

  const recommendations = getRecommendations();

  const getPriorityVariant = (priority: string) => {
    const map = {
      critical: 'destructive' as const,
      high: 'default' as const,
      medium: 'secondary' as const,
      low: 'outline' as const,
    };
    return map[priority as keyof typeof map] || 'secondary';
  };

  const getPriorityLabel = (priority: string) => {
    const map = {
      critical: 'حرجة',
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
    };
    return map[priority as keyof typeof map] || priority;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          التوصيات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            لا توجد توصيات حالياً - النظام في حالة صحية جيدة!
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                  <Badge variant={getPriorityVariant(rec.priority)}>
                    {getPriorityLabel(rec.priority)}
                  </Badge>
                </div>

                <Button variant="ghost" size="sm" className="mt-2" asChild>
                  <a href={rec.actionUrl}>
                    {rec.actionLabel}
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
