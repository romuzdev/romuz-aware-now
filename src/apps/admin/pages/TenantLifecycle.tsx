/**
 * M24 - Tenant Lifecycle Management
 * Comprehensive tenant management, subscriptions, and usage tracking
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Progress } from '@/core/components/ui/progress';
import {
  Users,
  Calendar,
  TrendingUp,
  Package,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  useTenantLifecycleEvents,
  useTenantSubscription,
  useTenantUsageStats,
  useTenantUsageVsLimits,
  useUpdateTenantSubscription,
  useSuspendTenantSubscription,
  useReactivateTenantSubscription,
} from '@/modules/platform/hooks';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function TenantLifecycle() {
  const [activeTab, setActiveTab] = useState('overview');
  const { tenantId } = useAppContext();
  
  const { data: events, isLoading: eventsLoading } = useTenantLifecycleEvents(tenantId || '');
  const { data: subscription, isLoading: subscriptionLoading } = useTenantSubscription(tenantId || '');
  const { data: usageStats, isLoading: usageLoading } = useTenantUsageStats(tenantId || '');
  const { data: usageVsLimits, isLoading: limitsLoading } = useTenantUsageVsLimits(tenantId || '');
  
  const updateSubscription = useUpdateTenantSubscription();
  const suspendSubscription = useSuspendTenantSubscription();
  const reactivateSubscription = useReactivateTenantSubscription();

  const getEventStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSubscriptionStatusBadge = (status?: string) => {
    switch (status) {
      case 'active': return <Badge>نشط</Badge>;
      case 'trial': return <Badge variant="secondary">تجريبي</Badge>;
      case 'suspended': return <Badge variant="destructive">معلق</Badge>;
      case 'cancelled': return <Badge variant="outline">ملغى</Badge>;
      default: return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return limit > 0 ? (current / limit) * 100 : 0;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (!tenantId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">الرجاء تحديد عميل أولاً</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">إدارة دورة حياة العميل</h1>
        <p className="text-muted-foreground">إدارة الاشتراكات والاستخدام والأحداث</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حالة الاشتراك</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscription?.plan_name || 'N/A'}</div>
            {subscription && getSubscriptionStatusBadge(subscription.subscription_status)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats && usageStats.length > 0 ? usageStats[0].active_users_count : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              من {subscription?.user_limit || 'غير محدود'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التخزين المستخدم</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats && usageStats.length > 0 
                ? `${usageStats[0].total_storage_gb.toFixed(2)} GB` 
                : '0 GB'}
            </div>
            <p className="text-xs text-muted-foreground">
              من {subscription?.storage_limit_gb || 'غير محدود'} GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صلاحية الاشتراك</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription?.end_date 
                ? format(new Date(subscription.end_date), 'dd MMM yyyy', { locale: ar })
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">تاريخ الانتهاء</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="subscription">الاشتراك</TabsTrigger>
          <TabsTrigger value="usage">الاستخدام</TabsTrigger>
          <TabsTrigger value="events">الأحداث</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Subscription Info */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الاشتراك</CardTitle>
                <CardDescription>تفاصيل الباقة والتسعير</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionLoading ? (
                  <p>جاري التحميل...</p>
                ) : subscription ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الباقة</span>
                      <span className="font-medium">{subscription.plan_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المستوى</span>
                      <Badge>{subscription.plan_tier}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">دورة الفوترة</span>
                      <span className="font-medium">{subscription.billing_cycle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">السعر الشهري</span>
                      <span className="font-medium">{subscription.monthly_price} ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">التجديد التلقائي</span>
                      <span className="font-medium">{subscription.auto_renew ? 'مفعل' : 'معطل'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد بيانات اشتراك</p>
                )}
              </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
              <CardHeader>
                <CardTitle>حدود الاستخدام</CardTitle>
                <CardDescription>الاستخدام الحالي مقابل الحدود</CardDescription>
              </CardHeader>
              <CardContent>
                {limitsLoading ? (
                  <p>جاري التحميل...</p>
                ) : usageVsLimits ? (
                  <div className="space-y-4">
                    {/* Users */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>المستخدمون</span>
                        <span className={getUsageColor(usageVsLimits.usagePercentages?.users || 0)}>
                          {usageVsLimits.currentUsage?.active_users_count || 0} / {usageVsLimits.subscription?.user_limit || '∞'}
                        </span>
                      </div>
                      <Progress value={usageVsLimits.usagePercentages?.users || 0} />
                    </div>

                    {/* Storage */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>التخزين</span>
                        <span className={getUsageColor(usageVsLimits.usagePercentages?.storage || 0)}>
                          {usageVsLimits.currentUsage?.total_storage_gb?.toFixed(2) || 0} / {usageVsLimits.subscription?.storage_limit_gb || '∞'} GB
                        </span>
                      </div>
                      <Progress value={usageVsLimits.usagePercentages?.storage || 0} />
                    </div>

                    {/* API Calls */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>استدعاءات API</span>
                        <span className={getUsageColor(usageVsLimits.usagePercentages?.apiCalls || 0)}>
                          {usageVsLimits.currentUsage?.api_calls_count || 0} / {usageVsLimits.subscription?.api_calls_limit || '∞'}
                        </span>
                      </div>
                      <Progress value={usageVsLimits.usagePercentages?.apiCalls || 0} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد بيانات حدود</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الاشتراك</CardTitle>
              <CardDescription>تفاصيل وإجراءات الاشتراك</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionLoading ? (
                <p>جاري التحميل...</p>
              ) : subscription ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">تاريخ البدء</p>
                      <p className="font-medium">
                        {format(new Date(subscription.start_date), 'dd MMMM yyyy', { locale: ar })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                      <p className="font-medium">
                        {subscription.end_date 
                          ? format(new Date(subscription.end_date), 'dd MMMM yyyy', { locale: ar })
                          : 'غير محدد'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {subscription.subscription_status === 'active' && (
                      <Button
                        variant="destructive"
                        onClick={() => suspendSubscription.mutate({ tenantId: tenantId!, reason: 'Admin action' })}
                        disabled={suspendSubscription.isPending}
                      >
                        تعليق الاشتراك
                      </Button>
                    )}
                    {subscription.subscription_status === 'suspended' && (
                      <Button
                        variant="default"
                        onClick={() => reactivateSubscription.mutate(tenantId!)}
                        disabled={reactivateSubscription.isPending}
                      >
                        إعادة تفعيل الاشتراك
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد بيانات اشتراك</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الاستخدام</CardTitle>
              <CardDescription>سجل الاستخدام اليومي</CardDescription>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <p>جاري التحميل...</p>
              ) : usageStats && usageStats.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {usageStats.map((stat) => (
                      <div key={stat.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">
                            {format(new Date(stat.stat_date), 'dd MMMM yyyy', { locale: ar })}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">المستخدمون</p>
                            <p className="font-medium">{stat.active_users_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">التخزين</p>
                            <p className="font-medium">{stat.total_storage_gb.toFixed(2)} GB</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">API</p>
                            <p className="font-medium">{stat.api_calls_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">الحملات</p>
                            <p className="font-medium">{stat.awareness_campaigns_count}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات استخدام</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل الأحداث</CardTitle>
              <CardDescription>تاريخ أحداث دورة حياة العميل</CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <p>جاري التحميل...</p>
              ) : events && events.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 border-r-2 border-border pr-3">
                        <div className="mt-1">
                          {getEventStatusIcon(event.event_status || '')}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{event.event_type}</p>
                            <Badge variant={event.event_status === 'completed' ? 'default' : 'secondary'}>
                              {event.event_status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.triggered_at), 'dd MMMM yyyy HH:mm', { locale: ar })}
                          </p>
                          {event.duration_seconds && (
                            <p className="text-xs text-muted-foreground">
                              المدة: {event.duration_seconds} ثانية
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد أحداث</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
