/**
 * M14 - Custom Dashboards Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserDashboards,
  getDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  setDefaultDashboard,
  shareDashboard,
  type CreateDashboardInput,
} from '@/integrations/supabase/dashboards/custom-dashboards';
import { logDashboardAction } from '@/lib/audit/audit-logger';
import { useToast } from '@/core/components/ui/use-toast';

/**
 * Hook to get all user dashboards
 */
export function useCustomDashboards() {
  return useQuery({
    queryKey: ['custom-dashboards'],
    queryFn: getUserDashboards,
  });
}

/**
 * Hook to get single dashboard
 */
export function useCustomDashboard(id: string) {
  return useQuery({
    queryKey: ['custom-dashboard', id],
    queryFn: () => getDashboard(id),
    enabled: !!id,
  });
}

/**
 * Hook to create dashboard
 */
export function useCreateDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateDashboardInput) => createDashboard(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
      logDashboardAction(data.id, 'create', { name: data.name_ar });
      toast({
        title: 'تم إنشاء اللوحة',
        description: 'تم إنشاء لوحة التحكم المخصصة بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل إنشاء لوحة التحكم',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update dashboard
 */
export function useUpdateDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateDashboardInput> }) =>
      updateDashboard(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['custom-dashboard', data.id] });
      logDashboardAction(data.id, 'update', { name: data.name_ar });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث لوحة التحكم بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل تحديث لوحة التحكم',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete dashboard
 */
export function useDeleteDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteDashboard(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
      logDashboardAction(id, 'delete');
      toast({
        title: 'تم الحذف',
        description: 'تم حذف لوحة التحكم بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل حذف لوحة التحكم',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to set default dashboard
 */
export function useSetDefaultDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => setDefaultDashboard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
      toast({
        title: 'تم التعيين',
        description: 'تم تعيين هذه اللوحة كافتراضية',
      });
    },
  });
}

/**
 * Hook to share dashboard
 */
export function useShareDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: string[] }) =>
      shareDashboard(id, roles),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['custom-dashboard', data.id] });
      toast({
        title: 'تم المشاركة',
        description: 'تم مشاركة لوحة التحكم بنجاح',
      });
    },
  });
}
