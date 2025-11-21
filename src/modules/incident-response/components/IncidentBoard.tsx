/**
 * M18: Incident Board Component
 * Kanban-style board for incident management
 */

import { useState } from 'react';
import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { AlertCircle, Clock, DollarSign, Link2 } from 'lucide-react';
import { useIncidents } from '../hooks/useIncidentManagement';
import { cn } from '@/lib/utils';

const STATUSES = [
  { id: 'open', nameAr: 'مفتوح', color: 'bg-blue-500' },
  { id: 'investigating', nameAr: 'قيد التحقيق', color: 'bg-yellow-500' },
  { id: 'containment', nameAr: 'احتواء', color: 'bg-orange-500' },
  { id: 'resolved', nameAr: 'محلول', color: 'bg-green-500' },
];

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800 border-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

export function IncidentBoard() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const { data: incidents, isLoading } = useIncidents({
    status: selectedStatus || undefined,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STATUSES.map(status => (
          <Card key={status.id} className="p-4 h-96 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  const incidentsByStatus = STATUSES.map(status => ({
    ...status,
    incidents: incidents?.filter(inc => inc.status === status.id) || [],
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">لوحة الحوادث</h2>
        <div className="flex gap-2">
          {STATUSES.map(status => (
            <Badge
              key={status.id}
              variant={selectedStatus === status.id ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedStatus(selectedStatus === status.id ? null : status.id)}
            >
              {status.nameAr} ({incidentsByStatus.find(s => s.id === status.id)?.incidents.length || 0})
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {incidentsByStatus.map(statusGroup => (
          <div key={statusGroup.id} className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <div className={cn('w-3 h-3 rounded-full', statusGroup.color)} />
              <span className="font-semibold">{statusGroup.nameAr}</span>
              <Badge variant="secondary" className="mr-auto">
                {statusGroup.incidents.length}
              </Badge>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
              {statusGroup.incidents.map(incident => (
                <Card
                  key={incident.id}
                  className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium line-clamp-2">
                        {incident.title_ar}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', SEVERITY_COLORS[incident.severity as keyof typeof SEVERITY_COLORS])}
                      >
                        {incident.severity}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span>{incident.incident_number}</span>
                    </div>

                    {incident.sla_response_deadline && (
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3" />
                        <span className={cn(
                          new Date(incident.sla_response_deadline) < new Date() && !incident.acknowledged_at
                            ? 'text-red-500 font-semibold'
                            : 'text-muted-foreground'
                        )}>
                          SLA: {new Date(incident.sla_response_deadline).toLocaleTimeString('ar-SA', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    )}

                    {(incident.estimated_cost || incident.actual_cost) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>
                          {incident.actual_cost 
                            ? `${incident.actual_cost.toLocaleString()} ر.س`
                            : `~${incident.estimated_cost?.toLocaleString()} ر.س`}
                        </span>
                      </div>
                    )}

                    {(incident.linked_events?.length || incident.linked_risks?.length || incident.linked_policies?.length) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        <span>
                          {(incident.linked_events?.length || 0) + 
                           (incident.linked_risks?.length || 0) + 
                           (incident.linked_policies?.length || 0)} مرتبطة
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {statusGroup.incidents.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  لا توجد حوادث
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
