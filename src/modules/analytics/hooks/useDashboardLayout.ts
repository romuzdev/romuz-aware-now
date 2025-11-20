/**
 * M14 Enhancement - Dashboard Layout Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchDashboardLayouts,
  fetchDefaultLayout,
  saveDashboardLayout,
  deleteDashboardLayout,
  setDefaultLayout
} from '../integration/dashboard-layouts.integration';
import type { SaveLayoutInput } from '../types/custom-kpi.types';

const DASHBOARD_LAYOUT_QUERY_KEY = 'dashboard-layouts';

/**
 * Fetch all dashboard layouts for user
 */
export function useDashboardLayouts() {
  const { tenantId, user } = useAppContext();

  return useQuery({
    queryKey: [DASHBOARD_LAYOUT_QUERY_KEY, 'list', tenantId, user?.id],
    queryFn: () => {
      if (!tenantId || !user?.id) throw new Error('Tenant ID and User ID are required');
      return fetchDashboardLayouts(tenantId, user.id);
    },
    enabled: !!tenantId && !!user?.id
  });
}

/**
 * Fetch default layout
 */
export function useDefaultLayout() {
  const { tenantId, user } = useAppContext();

  return useQuery({
    queryKey: [DASHBOARD_LAYOUT_QUERY_KEY, 'default', tenantId, user?.id],
    queryFn: () => {
      if (!tenantId || !user?.id) throw new Error('Tenant ID and User ID are required');
      return fetchDefaultLayout(tenantId, user.id);
    },
    enabled: !!tenantId && !!user?.id
  });
}

/**
 * Save dashboard layout
 */
export function useSaveDashboardLayout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId, user } = useAppContext();

  return useMutation({
    mutationFn: (input: SaveLayoutInput) => {
      if (!tenantId || !user?.id) throw new Error('Tenant ID and User ID are required');
      return saveDashboardLayout(tenantId, user.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_LAYOUT_QUERY_KEY] });
      toast({
        title: 'تم حفظ التخطيط',
        description: 'تم حفظ تخطيط اللوحة بنجاح'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل حفظ التخطيط',
        variant: 'destructive'
      });
    }
  });
}

/**
 * Delete dashboard layout
 */
export function useDeleteDashboardLayout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (layoutId: string) => deleteDashboardLayout(layoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_LAYOUT_QUERY_KEY] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف التخطيط'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل حذف التخطيط',
        variant: 'destructive'
      });
    }
  });
}

/**
 * Set layout as default
 */
export function useSetDefaultLayout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId, user } = useAppContext();

  return useMutation({
    mutationFn: (layoutId: string) => {
      if (!tenantId || !user?.id) throw new Error('Tenant ID and User ID are required');
      return setDefaultLayout(tenantId, user.id, layoutId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_LAYOUT_QUERY_KEY] });
      toast({
        title: 'تم التعيين',
        description: 'تم تعيين التخطيط كافتراضي'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل تعيين التخطيط',
        variant: 'destructive'
      });
    }
  });
}
