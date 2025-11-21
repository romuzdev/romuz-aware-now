/**
 * Security Events Hook
 * M18.5 - SecOps Integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchSecurityEvents,
  fetchSecurityEventById,
  createSecurityEvent,
  updateSecurityEvent,
  deleteSecurityEvent,
  markEventAsProcessed,
  fetchCorrelatedEvents,
  getEventCountBySeverity,
  fetchRecentCriticalEvents,
} from '../integration';
import type { SecurityEvent, SecurityEventFilters } from '../types';
import { toast } from 'sonner';
import { logSecurityEventAction } from '@/lib/audit/secops-audit-logger';

export function useSecurityEvents(filters?: SecurityEventFilters) {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ['security-events', tenantId, filters],
    queryFn: () => fetchSecurityEvents(filters),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (event: Omit<SecurityEvent, 'id' | 'created_at' | 'updated_at'>) =>
      createSecurityEvent(event),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['security-events', tenantId] });
      logSecurityEventAction(event.id, 'create', { severity: event.severity });
      toast.success('تم إنشاء الحدث الأمني بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء الحدث: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SecurityEvent> }) =>
      updateSecurityEvent(id, updates),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['security-events', tenantId] });
      logSecurityEventAction(event.id, 'update');
      toast.success('تم تحديث الحدث بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل التحديث: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      logSecurityEventAction(id, 'delete');
      return deleteSecurityEvent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events', tenantId] });
      toast.success('تم حذف الحدث بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل الحذف: ${error.message}`);
    },
  });

  const markProcessedMutation = useMutation({
    mutationFn: ({ id, incidentId }: { id: string; incidentId?: string }) =>
      markEventAsProcessed(id, incidentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events', tenantId] });
      toast.success('تم تحديث حالة المعالجة');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث الحالة: ${error.message}`);
    },
  });

  return {
    events: eventsQuery.data ?? [],
    loading: eventsQuery.isLoading,
    error: eventsQuery.error,
    createEvent: createMutation.mutate,
    updateEvent: updateMutation.mutate,
    deleteEvent: deleteMutation.mutate,
    markAsProcessed: markProcessedMutation.mutate,
    refetch: eventsQuery.refetch,
  };
}

export function useSecurityEventById(id: string | undefined) {
  return useQuery({
    queryKey: ['security-event', id],
    queryFn: () => fetchSecurityEventById(id!),
    enabled: !!id,
  });
}

export function useCorrelatedEvents(correlationId: string | undefined) {
  return useQuery({
    queryKey: ['correlated-events', correlationId],
    queryFn: () => fetchCorrelatedEvents(correlationId!),
    enabled: !!correlationId,
  });
}

export function useEventCountBySeverity() {
  return useQuery({
    queryKey: ['event-count-by-severity'],
    queryFn: getEventCountBySeverity,
  });
}

export function useRecentCriticalEvents(limit = 10) {
  return useQuery({
    queryKey: ['recent-critical-events', limit],
    queryFn: () => fetchRecentCriticalEvents(limit),
  });
}
