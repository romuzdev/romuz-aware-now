/**
 * M13.1 - Content Hub: useContentAnalytics Hook
 * Hook لتحليلات المحتوى
 */

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useToast } from '@/core/components/ui/use-toast';
import {
  getContentAnalytics,
  getOverviewStats,
  getTimeSeriesData,
  getContentTypeDistribution,
  getTopPerformingContent,
  getUserEngagementReport,
  exportAnalyticsToCSV,
  type ContentAnalytics,
  type OverviewStats,
  type TimeSeriesData,
} from '@/integrations/supabase/content-hub/analytics';

export function useContentAnalytics(
  contentId?: string,
  startDate?: string,
  endDate?: string
) {
  const { tenantId } = useAppContext();
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState<ContentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const data = await getContentAnalytics(tenantId, contentId, startDate, endDate);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل التحليلات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, contentId, startDate, endDate, toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    refresh: fetchAnalytics,
  };
}

/**
 * Hook for overview statistics
 */
export function useOverviewStats(startDate?: string, endDate?: string) {
  const { tenantId } = useAppContext();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getOverviewStats(tenantId, startDate, endDate);
        setStats(data);
      } catch (error) {
        console.error('Error fetching overview stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [tenantId, startDate, endDate]);

  return { stats, loading };
}

/**
 * Hook for time series data
 */
export function useTimeSeriesData(
  startDate: string,
  endDate: string,
  interval: 'day' | 'week' | 'month' = 'day'
) {
  const { tenantId } = useAppContext();
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const timeSeries = await getTimeSeriesData(tenantId, startDate, endDate, interval);
        setData(timeSeries);
      } catch (error) {
        console.error('Error fetching time series data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId, startDate, endDate, interval]);

  return { data, loading };
}

/**
 * Hook for content type distribution
 */
export function useContentTypeDistribution() {
  const { tenantId } = useAppContext();
  const [distribution, setDistribution] = useState<Array<{ type: string; count: number; percentage: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchDistribution = async () => {
      try {
        setLoading(true);
        const data = await getContentTypeDistribution(tenantId);
        setDistribution(data);
      } catch (error) {
        console.error('Error fetching content type distribution:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDistribution();
  }, [tenantId]);

  return { distribution, loading };
}

/**
 * Hook for top performing content
 */
export function useTopPerformingContent(
  metric: 'views' | 'likes' | 'shares' | 'engagement' = 'engagement',
  limit: number = 10
) {
  const { tenantId } = useAppContext();
  const [topContent, setTopContent] = useState<ContentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchTop = async () => {
      try {
        setLoading(true);
        const data = await getTopPerformingContent(tenantId, metric, limit);
        setTopContent(data);
      } catch (error) {
        console.error('Error fetching top performing content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTop();
  }, [tenantId, metric, limit]);

  return { topContent, loading };
}

/**
 * Hook for user engagement report
 */
export function useUserEngagementReport(userId?: string) {
  const { tenantId, user } = useAppContext();
  const targetUserId = userId || user?.id;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId || !targetUserId) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await getUserEngagementReport(tenantId, targetUserId);
        setReport(data);
      } catch (error) {
        console.error('Error fetching user engagement report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [tenantId, targetUserId]);

  return { report, loading };
}

/**
 * Hook for exporting analytics
 */
export function useAnalyticsExport() {
  const { tenantId } = useAppContext();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const exportToCSV = useCallback(async (startDate?: string, endDate?: string) => {
    if (!tenantId) return;

    try {
      setExporting(true);
      const csv = await exportAnalyticsToCSV(tenantId, startDate, endDate);

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `content_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'تم التصدير',
        description: 'تم تصدير التحليلات بنجاح',
      });
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير التحليلات',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  }, [tenantId, toast]);

  return {
    exportToCSV,
    exporting,
  };
}
