/**
 * M19 - Predictive Analytics Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  fetchPredictionModels,
  fetchPredictions,
  fetchPredictionStats,
} from '../integration/predictive-analytics.integration';
import type {
  PredictionRequest,
  PredictionFilters,
  ModelFilters,
} from '../types/predictive-analytics.types';

export function usePredictionModels(tenantId: string, filters?: ModelFilters) {
  return useQuery({
    queryKey: ['prediction-models', tenantId, filters],
    queryFn: () => fetchPredictionModels(tenantId, filters),
    enabled: !!tenantId,
  });
}

export function usePredictions(tenantId: string, filters?: PredictionFilters) {
  return useQuery({
    queryKey: ['predictions', tenantId, filters],
    queryFn: () => fetchPredictions(tenantId, filters),
    enabled: !!tenantId,
  });
}

export function usePredictionStats(tenantId: string) {
  return useQuery({
    queryKey: ['prediction-stats', tenantId],
    queryFn: () => fetchPredictionStats(tenantId),
    enabled: !!tenantId,
  });
}

export function useInitializeModels() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('init-prediction-models');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Models Initialized',
        description: `Created ${data.created} prediction models`,
      });
      queryClient.invalidateQueries({ queryKey: ['prediction-models'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initialize models',
      });
    },
  });
}

export function useCreatePrediction() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: PredictionRequest) => {
      const { data, error } = await supabase.functions.invoke('create-prediction', {
        body: request,
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Prediction Created',
        description: 'AI prediction generated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-stats'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Prediction Failed',
        description: error instanceof Error ? error.message : 'Failed to create prediction',
      });
    },
  });
}
