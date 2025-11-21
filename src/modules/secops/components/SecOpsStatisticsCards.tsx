/**
 * SecOps Statistics Cards Component
 * M18.5 - SecOps Integration
 */

import { Card } from '@/core/components/ui/card';
import { Shield, Activity, Zap, AlertTriangle } from 'lucide-react';
import type { SecOpsStatistics } from '../types';

interface SecOpsStatisticsCardsProps {
  statistics: SecOpsStatistics | null;
  loading?: boolean;
}

export function SecOpsStatisticsCards({ statistics, loading }: SecOpsStatisticsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-muted rounded w-full"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const cards = [
    {
      title: 'إجمالي الأحداث (24 ساعة)',
      value: (statistics.unprocessed_events || 0).toLocaleString('ar-SA'),
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'الأحداث الحرجة (24 ساعة)',
      value: statistics.critical_events_24h?.toLocaleString('ar-SA') || '0',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'أدلة SOAR النشطة',
      value: statistics.active_playbooks?.toLocaleString('ar-SA') || '0',
      icon: Zap,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'الموصلات النشطة',
      value: statistics.active_connectors?.toLocaleString('ar-SA') || '0',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <p className="text-3xl font-bold mt-2">{card.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
