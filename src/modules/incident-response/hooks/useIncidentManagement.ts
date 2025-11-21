/**
 * M18: Incident Management Hook
 * Enhanced incident CRUD with SLA tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchIncidents, 
  fetchIncidentById,
  createIncident,
  updateIncident,
  linkEventsToIncident,
  linkRisksToIncident,
  linkPoliciesToIncident,
  checkSLABreach,
  fetchIncidentStatistics
} from '@/integrations/supabase/incident-response';
import { useToast } from '@/hooks/use-toast';
import { logIncidentAction } from '@/lib/audit/audit-logger';

/**
 * Fetch all incidents
 */
export function useIncidents(filters?: {
  status?: string;
  severity?: string;
  assignedTo?: string;
}) {
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: () => fetchIncidents(filters),
  });
}

/**
 * Fetch incident by ID
 */
export function useIncidentById(id: string) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => fetchIncidentById(id),
    enabled: !!id,
  });
}

/**
 * Create incident
 */
export function useCreateIncident() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createIncident,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      logIncidentAction(data.id, 'create', { 
        title: data.title_ar,
        severity: data.severity 
      });
      toast({
        title: 'تم إنشاء الحادثة',
        description: 'تم إنشاء الحادثة الأمنية بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الحادثة',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update incident
 */
export function useUpdateIncident() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateIncident(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', data.id] });
      logIncidentAction(data.id, 'update');
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الحادثة بنجاح',
      });
    },
  });
}

/**
 * Link entities to incident
 */
export function useLinkToIncident() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      incidentId, 
      entityType, 
      entityIds 
    }: { 
      incidentId: string; 
      entityType: 'events' | 'risks' | 'policies';
      entityIds: string[];
    }) => {
      if (entityType === 'events') {
        await linkEventsToIncident(incidentId, entityIds);
      } else if (entityType === 'risks') {
        await linkRisksToIncident(incidentId, entityIds);
      } else if (entityType === 'policies') {
        await linkPoliciesToIncident(incidentId, entityIds);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incident', variables.incidentId] });
      toast({
        title: 'تم الربط',
        description: 'تم ربط الكيانات بالحادثة بنجاح',
      });
    },
  });
}

/**
 * Check SLA breach
 */
export function useCheckSLABreach(incidentId: string) {
  return useQuery({
    queryKey: ['sla-breach', incidentId],
    queryFn: () => checkSLABreach(incidentId),
    enabled: !!incidentId,
    refetchInterval: 60000, // Check every minute
  });
}

/**
 * Fetch incident statistics
 */
export function useIncidentStatistics() {
  return useQuery({
    queryKey: ['incident-statistics'],
    queryFn: fetchIncidentStatistics,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
