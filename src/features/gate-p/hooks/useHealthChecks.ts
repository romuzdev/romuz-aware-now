import { useQuery } from '@tanstack/react-query';

export type HealthCheckStatus = 'success' | 'warning' | 'error';

export type HealthCheck = {
  name: string;
  status: HealthCheckStatus;
  message: string;
};

export type HealthData = {
  migrations: HealthCheck[];
  indexes: HealthCheck[];
  rls: HealthCheck[];
};

async function fetchHealthChecks(): Promise<HealthData> {
  // Mock data for now - replace with actual health check logic
  return {
    migrations: [
      {
        name: 'Latest Migration',
        status: 'success',
        message: 'All migrations up to date',
      },
    ],
    indexes: [
      {
        name: 'campaigns.tenant_id + archived_at',
        status: 'warning',
        message: 'Consider composite index for faster filtered queries',
      },
      {
        name: 'participants.campaign_id + deleted_at',
        status: 'warning',
        message: 'Advisory: Add composite index for better performance',
      },
    ],
    rls: [
      {
        name: 'awareness_campaigns RLS',
        status: 'success',
        message: 'All CRUD policies enabled',
      },
      {
        name: 'campaign_participants RLS',
        status: 'success',
        message: 'All CRUD policies enabled',
      },
      {
        name: 'saved_views RLS',
        status: 'success',
        message: 'User + Tenant isolation enforced',
      },
    ],
  };
}

export function useHealthChecks() {
  return useQuery({
    queryKey: ['health-checks'],
    queryFn: fetchHealthChecks,
    refetchInterval: false, // Manual only
    staleTime: Infinity,
  });
}
