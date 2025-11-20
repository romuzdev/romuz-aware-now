/**
 * Event Statistics Component
 * 
 * بطاقات الإحصائيات للأحداث
 */

import { Activity, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import type { SystemEvent } from '@/lib/events/event.types';
import { useMemo } from 'react';

interface EventStatisticsProps {
  events: SystemEvent[];
}

export function EventStatistics({ events }: EventStatisticsProps) {
  const stats = useMemo(() => {
    const total = events.length;
    const pending = events.filter(e => e.status === 'pending').length;
    const processed = events.filter(e => e.processed_at !== null).length;
    const critical = events.filter(e => e.priority === 'critical').length;

    // Calculate events per hour (last 24 hours)
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const eventsLast24h = events.filter(e => new Date(e.created_at) >= last24h);
    const eventsPerHour = eventsLast24h.length / 24;

    return {
      total,
      pending,
      processed,
      critical,
      eventsPerHour: eventsPerHour.toFixed(1),
    };
  }, [events]);

  const cards = [
    {
      title: 'إجمالي الأحداث',
      value: stats.total,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'قيد الانتظار',
      value: stats.pending,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'معالجة',
      value: stats.processed,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'حرجة',
      value: stats.critical,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'أحداث/ساعة',
      value: stats.eventsPerHour,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div key={card.title} className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold mt-2">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <IconComponent className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
