import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HealthJobsData = {
  auditRate24h: number;
  queueBacklog: number;
};

async function fetchHealthJobs(): Promise<HealthJobsData> {
  // Calculate audit insertion rate (last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const { count: auditCount } = await supabase
    .from('audit_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo.toISOString());

  const auditRate24h = Math.round((auditCount || 0) / 24);

  // Get notification queue backlog
  const { count: queueCount } = await supabase
    .from('notification_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    auditRate24h,
    queueBacklog: queueCount || 0,
  };
}

export function useHealthJobs() {
  return useQuery({
    queryKey: ['health-jobs'],
    queryFn: fetchHealthJobs,
    refetchInterval: false, // Manual only
    staleTime: Infinity,
  });
}
