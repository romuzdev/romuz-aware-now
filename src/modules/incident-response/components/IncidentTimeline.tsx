/**
 * M18: Incident Timeline Component
 * Interactive timeline view for incident events
 */

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Clock, AlertCircle, CheckCircle, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchIncidentTimeline } from '@/integrations/supabase/incident-response';

interface IncidentTimelineProps {
  incidentId: string;
}

export function IncidentTimeline({ incidentId }: IncidentTimelineProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['incident-timeline', incidentId],
    queryFn: () => fetchIncidentTimeline(incidentId),
    enabled: !!incidentId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الجدول الزمني</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الجدول الزمني</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            لا توجد أحداث مسجلة بعد
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'detection':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'investigation':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'resolution':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>الجدول الزمني</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-background">
                  {getEventIcon(event.event_type)}
                </div>
                {index < events.length - 1 && (
                  <div className="h-full w-px bg-border"></div>
                )}
              </div>
              <div className="flex-1 pb-8">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{event.event_title_ar}</h4>
                  <Badge variant="outline">
                    {new Date(event.occurred_at).toLocaleString('ar-SA')}
                  </Badge>
                </div>
                {event.event_description_ar && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {event.event_description_ar}
                  </p>
                )}
                {event.actor_id && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>المستخدم: {event.actor_id.slice(0, 8)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
