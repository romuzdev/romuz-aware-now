/**
 * M18: Incident Response - Dashboard Page
 */

import { PageHeader } from '@/core/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { AlertTriangle, Shield, Clock, CheckCircle, TrendingUp, Activity, Plug, Settings } from 'lucide-react';
import { useIncidentStatistics, useIncidents } from '../hooks';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Badge } from '@/core/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function IncidentDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { data: stats, isLoading: statsLoading } = useIncidentStatistics();
  const { data: incidents, isLoading: incidentsLoading } = useIncidents({
    limit: 5
  });

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;
    return colors[severity as keyof typeof colors] || 'secondary';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'destructive',
      investigating: 'default',
      contained: 'default',
      resolved: 'secondary',
      closed: 'secondary'
    } as const;
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { ar: string; en: string }> = {
      open: { ar: 'مفتوح', en: 'Open' },
      investigating: { ar: 'قيد التحقيق', en: 'Investigating' },
      contained: { ar: 'محتوى', en: 'Contained' },
      resolved: { ar: 'محلول', en: 'Resolved' },
      closed: { ar: 'مغلق', en: 'Closed' }
    };
    return isRTL ? statusMap[status]?.ar || status : statusMap[status]?.en || status;
  };

  const getSeverityText = (severity: string) => {
    const severityMap: Record<string, { ar: string; en: string }> = {
      critical: { ar: 'حرج', en: 'Critical' },
      high: { ar: 'عالي', en: 'High' },
      medium: { ar: 'متوسط', en: 'Medium' },
      low: { ar: 'منخفض', en: 'Low' }
    };
    return isRTL ? severityMap[severity]?.ar || severity : severityMap[severity]?.en || severity;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader
          title={isRTL ? 'لوحة تحكم الاستجابة للحوادث' : 'Incident Response Dashboard'}
          description={isRTL ? 'نظرة عامة على الحوادث الأمنية والاستجابة' : 'Overview of security incidents and response status'}
        />
        <div className="flex gap-2">
          <Link to="/incident-response/integrations">
            <Button variant="outline" size="sm">
              <Plug className="h-4 w-4 mr-2" />
              {isRTL ? 'التكاملات الخارجية' : 'Integrations'}
            </Button>
          </Link>
          <Link to="/incident-response/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              {isRTL ? 'الإعدادات' : 'Settings'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? 'الحوادث النشطة' : 'Active Incidents'}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats?.byStatus.open || 0) + (stats?.byStatus.investigating || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'تتطلب اهتماماً فورياً' : 'Require immediate attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? 'حوادث حرجة' : 'Critical Incidents'}
            </CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.bySeverity.critical || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'أولوية قصوى' : 'Highest priority'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? 'قيد التحقيق' : 'Under Investigation'}
            </CardTitle>
            <Activity className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.byStatus.investigating || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'جاري العمل عليها' : 'Being investigated'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? 'تم الحل' : 'Resolved'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.byStatus.resolved || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'هذا الشهر' : 'This month'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{isRTL ? 'الحوادث الأخيرة' : 'Recent Incidents'}</CardTitle>
              <CardDescription>
                {isRTL ? 'أحدث الحوادث الأمنية المسجلة' : 'Latest security incidents recorded'}
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/incident-response/active">
                {isRTL ? 'عرض الكل' : 'View All'}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {incidentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : incidents && incidents.length > 0 ? (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <Link
                  key={incident.id}
                  to={`/incident-response/incident/${incident.id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(incident.severity)}>
                          {getSeverityText(incident.severity)}
                        </Badge>
                        <Badge variant="outline">
                          {incident.incident_number}
                        </Badge>
                        <Badge variant={getStatusColor(incident.status)}>
                          {getStatusText(incident.status)}
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {isRTL ? incident.title_ar : incident.title_en}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {isRTL ? incident.description_ar : incident.description_en}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(incident.created_at), {
                          addSuffix: true,
                          locale: isRTL ? ar : undefined
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isRTL ? 'لا توجد حوادث مسجلة' : 'No incidents recorded'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Statistics by Type */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRTL ? 'التوزيع حسب الخطورة' : 'By Severity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{isRTL ? 'حرج' : 'Critical'}</span>
                  <span className="font-bold text-destructive">{stats?.bySeverity.critical || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{isRTL ? 'عالي' : 'High'}</span>
                  <span className="font-bold text-destructive">{stats?.bySeverity.high || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{isRTL ? 'متوسط' : 'Medium'}</span>
                  <span className="font-bold">{stats?.bySeverity.medium || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{isRTL ? 'منخفض' : 'Low'}</span>
                  <span className="font-bold">{stats?.bySeverity.low || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRTL ? 'التوزيع حسب الحالة' : 'By Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{isRTL ? 'مفتوح' : 'Open'}</span>
                  <span className="font-bold text-destructive">{stats?.byStatus.open || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{isRTL ? 'قيد التحقيق' : 'Investigating'}</span>
                  <span className="font-bold">{stats?.byStatus.investigating || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{isRTL ? 'محتوى' : 'Contained'}</span>
                  <span className="font-bold">{stats?.byStatus.contained || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{isRTL ? 'محلول' : 'Resolved'}</span>
                  <span className="font-bold">{stats?.byStatus.resolved || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
