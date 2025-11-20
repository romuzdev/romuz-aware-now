/**
 * M18: Incident Response - Dashboard Page
 */

import { PageHeader } from '@/core/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { AlertTriangle, Shield, Clock, CheckCircle } from 'lucide-react';
import { useIncidentStatistics } from '../hooks';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

export default function IncidentDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { data: stats, isLoading } = useIncidentStatistics();

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRTL ? 'لوحة تحكم الاستجابة للحوادث' : 'Incident Response Dashboard'}
        description={isRTL ? 'نظرة عامة على الحوادث الأمنية والاستجابة' : 'Overview of security incidents and response status'}
      />

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
            {isLoading ? (
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
            {isLoading ? (
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
              {isRTL ? 'قيد المعالجة' : 'In Progress'}
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.byStatus.investigating || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'جاري العمل عليها' : 'Being worked on'}
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
            {isLoading ? (
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
          <CardTitle>{isRTL ? 'الحوادث الأخيرة' : 'Recent Incidents'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isRTL ? 'سيتم عرض الحوادث الأخيرة هنا' : 'Recent incidents will be displayed here'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
