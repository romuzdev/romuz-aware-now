/**
 * M20 - Threat Intelligence Dashboard
 * Overview of threat intelligence status and recent activity
 */

import { Activity, Shield, Database, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/core/components/ui/page-header';
import { StatCard } from '@/core/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useThreatStats, useRecentMatches } from '@/modules/threat-intelligence';
import { Badge } from '@/core/components/ui/badge';
import { format } from 'date-fns';

export default function ThreatIntelligenceDashboard() {
  const { data: stats, isLoading: statsLoading } = useThreatStats();
  const { data: recentMatches, isLoading: matchesLoading } = useRecentMatches(10);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        icon={Shield}
        title="Threat Intelligence"
        description="Monitor and analyze cyber threat indicators"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Active Feeds"
              value={stats?.activeFeeds || 0}
              icon={Database}
            />
            <StatCard
              title="Total Indicators"
              value={stats?.totalIndicators || 0}
              icon={AlertTriangle}
            />
            <StatCard
              title="Recent Matches"
              value={stats?.recentMatches || 0}
              icon={Shield}
            />
            <StatCard
              title="Critical Threats"
              value={stats?.criticalThreats || 0}
              icon={Activity}
            />
          </>
        )}
      </div>

      {/* Recent Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Threat Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {matchesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentMatches && recentMatches.length > 0 ? (
            <div className="space-y-3">
              {recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(match.severity)}>
                        {match.severity}
                      </Badge>
                      <span className="font-medium">{match.matched_value}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Source: {match.matched_entity_type}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {format(new Date(match.matched_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No threat matches found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
