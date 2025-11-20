import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface TimelineTabProps {
  committeeId: string;
}

export default function CommitteeTimelineTab({ committeeId }: TimelineTabProps) {
  const { t } = useTranslation();

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['committee-audit', committeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .or(`entity.eq.committee,record_id.eq.${committeeId}`)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('committees.tabs.timeline')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-muted-foreground">{t('common.loading')}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('committees.tabs.timeline')}</CardTitle>
      </CardHeader>
      <CardContent>
        {auditLogs && auditLogs.length > 0 ? (
          <div className="space-y-4">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="flex gap-4 pb-4 border-b last:border-0">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="w-0.5 h-full bg-border mt-2" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      {log.action?.toUpperCase() || 'ACTION'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Entity: {log.entity} | Actor: {log.actor_id}
                  </p>
                  {log.diff && (
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(log.diff, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No audit logs found for this committee</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
