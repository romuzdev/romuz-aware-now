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
  aiAdvisory: {
    recommendations: (tenantId?: string, filters?: any) => ['ai-recommendations', tenantId ?? 'all', filters ?? {}] as const,
    recommendationById: (id: string) => ['ai-recommendation', id] as const,
    stats: (tenantId?: string) => ['ai-recommendation-stats', tenantId ?? 'all'] as const,
  },
  threatIntelligence: {
    feeds: (filters?: any) => ['threat-feeds', filters ?? {}] as const,
    feedById: (id: string) => ['threat-feed', id] as const,
    indicators: (filters?: any) => ['threat-indicators', filters ?? {}] as const,
    indicatorById: (id: string) => ['threat-indicator', id] as const,
    matches: (filters?: any) => ['threat-matches', filters ?? {}] as const,
    matchById: (id: string) => ['threat-match', id] as const,
    stats: () => ['threat-stats'] as const,
    recentMatches: (limit: number) => ['threat-recent-matches', limit] as const,
  },
};
