export const qk = {
  campaigns: {
    list: (params?: any) => ['campaigns', 'list', params ?? {}] as const,
    byId: (id?: string) => ['campaigns', 'byId', id ?? ''] as const,
  },
  audit: {
    byCampaign: (id?: string) => ['audit', 'campaign', id ?? ''] as const,
  },
  views: {
    list: () => ['campaign_views', 'list'] as const,
  },
  gateH: {
    all: () => ['gate-h'] as const,
    actions: (filters?: string) => ['gate-h', 'actions', filters ?? 'all'] as const,
    actionById: (id: string) => ['gate-h', 'actions', id] as const,
    actionUpdates: (actionId: string) => ['gate-h', 'actions', actionId, 'updates'] as const,
  },
  gateN: {
    status: () => ['gate-n', 'status'] as const,
    jobs: () => ['gate-n', 'jobs'] as const,
    settings: () => ['gate-n', 'settings'] as const,
    jobRuns: (jobKey?: string) => ['gate-n', 'job-runs', jobKey ?? 'all'] as const,
    healthCheck: () => ['gate-n', 'health-check'] as const,
  },
  gateP: {
    tenants: () => ['gate-p-tenants'] as const,
    lifecycleLog: (tenantId: string) => ['lifecycle-log', tenantId] as const,
    healthStatus: (tenantId: string) => ['health-status', tenantId] as const,
    allHealthStatuses: () => ['all-health-statuses'] as const,
    automationActions: (tenantId?: string) => ['automation-actions', tenantId ?? 'all'] as const,
  },
};
