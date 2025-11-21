/**
 * M14 - Dashboard Widgets Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWidgets,
  getWidget,
  getWidgetData,
  createWidget,
  updateWidget,
  deleteWidget,
  type CreateWidgetInput,
} from '@/integrations/supabase/dashboards/dashboard-widgets';
import { logWidgetAction } from '@/lib/audit/audit-logger';
import { useToast } from '@/core/components/ui/use-toast';

/**
 * Hook to get all widgets
 */
export function useDashboardWidgets(category?: string, widgetType?: string) {
  return useQuery({
    queryKey: ['dashboard-widgets', category, widgetType],
    queryFn: () => getWidgets(category, widgetType),
  });
}

/**
 * Hook to get single widget
 */
export function useDashboardWidget(id: string) {
  return useQuery({
    queryKey: ['dashboard-widget', id],
    queryFn: () => getWidget(id),
    enabled: !!id,
  });
}

/**
 * Hook to get widget data
 */
export function useWidgetData(widgetId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['widget-data', widgetId],
    queryFn: () => getWidgetData(widgetId),
    enabled: enabled && !!widgetId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 4 * 60 * 1000, // Consider stale after 4 minutes
  });
}

/**
 * Hook to create widget
 */
export function useCreateWidget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateWidgetInput) => createWidget(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
      logWidgetAction(data.id, 'create', { name: data.name_ar, type: data.widget_type });
      toast({
        title: 'تم إنشاء الأداة',
        description: 'تم إنشاء الأداة بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل إنشاء الأداة',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update widget
 */
export function useUpdateWidget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateWidgetInput> }) =>
      updateWidget(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-widget', data.id] });
      queryClient.invalidateQueries({ queryKey: ['widget-data', data.id] });
      logWidgetAction(data.id, 'update', { name: data.name_ar });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الأداة بنجاح',
      });
    },
  });
}

/**
 * Hook to delete widget
 */
export function useDeleteWidget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteWidget(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
      logWidgetAction(id, 'delete');
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الأداة بنجاح',
      });
    },
  });
}

/**
 * Hook to refresh widget data
 */
export function useRefreshWidgetData() {
  const queryClient = useQueryClient();

  return (widgetId: string) => {
    queryClient.invalidateQueries({ queryKey: ['widget-data', widgetId] });
  };
}
