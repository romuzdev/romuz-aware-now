/**
 * Threat Hunting Hook
 * M18.5 - SecOps Enhancement
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchThreatHuntQueries,
  fetchThreatHuntQueryById,
  createThreatHuntQuery,
  updateThreatHuntQuery,
  deleteThreatHuntQuery,
  executeThreatHuntQuery,
  fetchThreatHuntResults,
  fetchThreatHuntDashboard,
} from '../integration/threat-hunting.integration';
import type { ThreatHuntQuery, ThreatHuntFilters } from '../types/threat-hunting.types';

export function useThreatHunting(filters?: ThreatHuntFilters) {
  const { tenantId } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: queries = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['threat-hunt-queries', tenantId, filters],
    queryFn: () => fetchThreatHuntQueries(filters),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: createThreatHuntQuery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threat-hunt-queries'] });
      toast({
        title: 'تم إنشاء الاستعلام',
        description: 'تم حفظ استعلام الصيد عن التهديدات بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'فشل الإنشاء',
        description: 'حدث خطأ أثناء حفظ الاستعلام',
        variant: 'destructive',
      });
      console.error('Create query error:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ThreatHuntQuery> }) =>
      updateThreatHuntQuery(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threat-hunt-queries'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الاستعلام بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'فشل التحديث',
        description: 'حدث خطأ أثناء تحديث الاستعلام',
        variant: 'destructive',
      });
      console.error('Update query error:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteThreatHuntQuery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threat-hunt-queries'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الاستعلام بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'فشل الحذف',
        description: 'حدث خطأ أثناء حذف الاستعلام',
        variant: 'destructive',
      });
      console.error('Delete query error:', error);
    },
  });

  const executeMutation = useMutation({
    mutationFn: executeThreatHuntQuery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threat-hunt-queries'] });
      queryClient.invalidateQueries({ queryKey: ['threat-hunt-results'] });
      toast({
        title: 'تم التنفيذ',
        description: 'تم تنفيذ الاستعلام بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'فشل التنفيذ',
        description: 'حدث خطأ أثناء تنفيذ الاستعلام',
        variant: 'destructive',
      });
      console.error('Execute query error:', error);
    },
  });

  return {
    queries,
    loading,
    error,
    createQuery: createMutation.mutate,
    updateQuery: updateMutation.mutate,
    deleteQuery: deleteMutation.mutate,
    executeQuery: executeMutation.mutate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['threat-hunt-queries'] }),
  };
}

export function useThreatHuntQueryById(id: string | undefined) {
  return useQuery({
    queryKey: ['threat-hunt-query', id],
    queryFn: () => fetchThreatHuntQueryById(id!),
    enabled: !!id,
  });
}

export function useThreatHuntResults(queryId: string | undefined, limit?: number) {
  return useQuery({
    queryKey: ['threat-hunt-results', queryId, limit],
    queryFn: () => fetchThreatHuntResults(queryId!, limit),
    enabled: !!queryId,
  });
}

export function useThreatHuntDashboard() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['threat-hunt-dashboard', tenantId],
    queryFn: fetchThreatHuntDashboard,
    enabled: !!tenantId,
  });
}
