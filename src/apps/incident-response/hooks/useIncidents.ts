/**
 * M18: Incident Response System - React Hooks
 * Custom hooks for incident management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  acknowledgeIncident,
  assignIncident,
  closeIncident,
  getIncidentTimeline,
  addIncidentNote,
  getResponsePlans,
  getIncidentStatistics,
  searchIncidents,
} from '@/integrations/supabase/incidents';
import { useToast } from '@/core/components/ui/use-toast';
import type {
  CreateIncidentInput,
  UpdateIncidentInput,
  CloseIncidentInput,
} from '@/lib/validators/incident-validators';

/**
 * Hook: Get all incidents with filters
 */
export function useIncidents(filters?: {
  status?: string;
  severity?: string;
  incidentType?: string;
  assignedTo?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: () => getIncidents(filters),
  });
}

/**
 * Hook: Get incident by ID
 */
export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => (id ? getIncidentById(id) : null),
    enabled: !!id,
  });
}

/**
 * Hook: Get incident timeline
 */
export function useIncidentTimeline(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['incident-timeline', incidentId],
    queryFn: () => (incidentId ? getIncidentTimeline(incidentId) : null),
    enabled: !!incidentId,
  });
}

/**
 * Hook: Get response plans
 */
export function useResponsePlans(incidentType?: string) {
  return useQuery({
    queryKey: ['response-plans', incidentType],
    queryFn: () => getResponsePlans(incidentType),
  });
}

/**
 * Hook: Get incident statistics
 */
export function useIncidentStatistics(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['incident-statistics', params],
    queryFn: () => getIncidentStatistics(params),
  });
}

/**
 * Hook: Create incident mutation
 */
export function useCreateIncident() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateIncidentInput, 'reported_by'>) => {
      return createIncident(input as any);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-statistics'] });
      
      toast({
        title: 'تم إنشاء الحدث',
        description: `رقم الحدث: ${data.incident_number}`,
      });
    },
    onError: (error) => {
      console.error('Create incident error:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل إنشاء الحدث',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Update incident mutation
 */
export function useUpdateIncident() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateIncidentInput }) => {
      return updateIncident(id, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incident', data.id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-timeline', data.id] });
      
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الحدث بنجاح',
      });
    },
    onError: (error) => {
      console.error('Update incident error:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل تحديث الحدث',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Acknowledge incident mutation
 */
export function useAcknowledgeIncident() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (incidentId: string) => acknowledgeIncident(incidentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incident', data.id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-timeline', data.id] });
      
      toast({
        title: 'تم التأكيد',
        description: 'تم تأكيد استلام الحدث',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل تأكيد الحدث',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Assign incident mutation
 */
export function useAssignIncident() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ incidentId, assignedTo }: { incidentId: string; assignedTo: string }) => {
      return assignIncident(incidentId, assignedTo);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incident', data.id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-timeline', data.id] });
      
      toast({
        title: 'تم التعيين',
        description: 'تم تعيين الحدث بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل تعيين الحدث',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Close incident mutation
 */
export function useCloseIncident() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ incidentId, resolution }: { incidentId: string; resolution: CloseIncidentInput }) => {
      return closeIncident(incidentId, resolution);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incident', data.id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-timeline', data.id] });
      queryClient.invalidateQueries({ queryKey: ['incident-statistics'] });
      
      toast({
        title: 'تم الإغلاق',
        description: `تم إغلاق الحدث: ${data.incident_number}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل إغلاق الحدث',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Add note mutation
 */
export function useAddIncidentNote() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      incidentId, 
      noteAr, 
      noteEn 
    }: { 
      incidentId: string; 
      noteAr: string; 
      noteEn?: string;
    }) => {
      return addIncidentNote(incidentId, noteAr, noteEn);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incident-timeline', variables.incidentId] });
      
      toast({
        title: 'تمت الإضافة',
        description: 'تمت إضافة الملاحظة بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل إضافة الملاحظة',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Search incidents
 */
export function useSearchIncidents(query: string) {
  return useQuery({
    queryKey: ['search-incidents', query],
    queryFn: () => (query.trim().length >= 2 ? searchIncidents(query) : []),
    enabled: query.trim().length >= 2,
  });
}
