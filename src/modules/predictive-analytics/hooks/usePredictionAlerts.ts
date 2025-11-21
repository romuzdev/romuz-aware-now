/**
 * M19: Prediction Alerts Hook
 * Manage alerts generated from predictions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPredictionAlerts,
  createPredictionAlert,
  acknowledgePredictionAlert,
} from '@/integrations/supabase/predictive-analytics';
import { useToast } from '@/core/hooks/use-toast';

/**
 * Fetch prediction alerts
 */
export function usePredictionAlerts(filters?: {
  status?: string;
  severity?: string;
}) {
  return useQuery({
    queryKey: ['prediction-alerts', filters],
    queryFn: () => fetchPredictionAlerts(filters),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Create prediction alert
 */
export function useCreatePredictionAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createPredictionAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prediction-alerts'] });
      toast({
        title: 'تم إنشاء التنبيه',
        description: 'تم إنشاء تنبيه التنبؤ بنجاح',
      });
    },
  });
}

/**
 * Acknowledge alert
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: acknowledgePredictionAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prediction-alerts'] });
      toast({
        title: 'تم الإقرار',
        description: 'تم الإقرار بالتنبيه',
      });
    },
  });
}
