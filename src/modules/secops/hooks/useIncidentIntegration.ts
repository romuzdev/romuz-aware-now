/**
 * Incident Integration Hook
 * M18.5 - M18 Integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  createIncidentFromEvent,
  fetchEventIncident,
  fetchIncidentEvents,
  unlinkEventFromIncident,
} from '../integration/incidents-integration.integration';
import type { Incident } from '../integration/incidents-integration.integration';

export function useIncidentIntegration(eventId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: incident, isLoading: loadingIncident } = useQuery({
    queryKey: ['event-incident', eventId],
    queryFn: () => fetchEventIncident(eventId!),
    enabled: !!eventId,
  });

  const createIncidentMutation = useMutation({
    mutationFn: ({
      eventId,
      incidentData,
    }: {
      eventId: string;
      incidentData: Partial<Incident>;
    }) => createIncidentFromEvent(eventId, incidentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-incident'] });
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
      toast({
        title: 'تم إنشاء الحادثة',
        description: 'تم إنشاء حادثة أمنية من هذا الحدث',
      });
    },
    onError: (error) => {
      toast({
        title: 'فشل الإنشاء',
        description: 'حدث خطأ أثناء إنشاء الحادثة',
        variant: 'destructive',
      });
      console.error('Create incident error:', error);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: unlinkEventFromIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-incident'] });
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
      toast({
        title: 'تم الفصل',
        description: 'تم فصل الحدث عن الحادثة',
      });
    },
    onError: (error) => {
      toast({
        title: 'فشل الفصل',
        description: 'حدث خطأ أثناء فصل الحدث عن الحادثة',
        variant: 'destructive',
      });
      console.error('Unlink incident error:', error);
    },
  });

  return {
    incident,
    loadingIncident,
    createIncident: createIncidentMutation.mutate,
    unlinkIncident: unlinkMutation.mutate,
  };
}

export function useIncidentEvents(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['incident-events', incidentId],
    queryFn: () => fetchIncidentEvents(incidentId!),
    enabled: !!incidentId,
  });
}
