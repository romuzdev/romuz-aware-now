/**
 * M19: Predictive Models Hook
 * Manage ML models and predictions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPredictionModels,
  fetchModelById,
  fetchPredictionsByModel,
  fetchPredictionsByContext,
  createPrediction,
  recordActualValue,
  providePredictionFeedback,
  fetchTrainingHistory,
  recordTrainingSession,
  fetchModelAccuracyMetrics,
} from '@/integrations/supabase/predictive-analytics';
import { useToast } from '@/hooks/use-toast';

/**
 * Fetch all prediction models
 */
export function usePredictionModels(filters?: {
  modelType?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: ['prediction-models', filters],
    queryFn: () => fetchPredictionModels(filters),
  });
}

/**
 * Fetch model by ID
 */
export function useModelById(id: string) {
  return useQuery({
    queryKey: ['prediction-model', id],
    queryFn: () => fetchModelById(id),
    enabled: !!id,
  });
}

/**
 * Fetch predictions for a model
 */
export function usePredictionsByModel(modelId: string, limit?: number) {
  return useQuery({
    queryKey: ['predictions', 'by-model', modelId, limit],
    queryFn: () => fetchPredictionsByModel(modelId, limit),
    enabled: !!modelId,
  });
}

/**
 * Fetch predictions for a context
 */
export function usePredictionsByContext(contextType: string, contextId: string) {
  return useQuery({
    queryKey: ['predictions', 'by-context', contextType, contextId],
    queryFn: () => fetchPredictionsByContext(contextType, contextId),
    enabled: !!contextType && !!contextId,
  });
}

/**
 * Create prediction
 */
export function useCreatePrediction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createPrediction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      toast({
        title: 'تم إنشاء التنبؤ',
        description: 'تم إنشاء التنبؤ بنجاح',
      });
    },
  });
}

/**
 * Record actual value for prediction
 */
export function useRecordActualValue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      predictionId, 
      actualValue, 
      accuracyDelta 
    }: { 
      predictionId: string; 
      actualValue: any; 
      accuracyDelta: number;
    }) => recordActualValue(predictionId, actualValue, accuracyDelta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      toast({
        title: 'تم التسجيل',
        description: 'تم تسجيل القيمة الفعلية',
      });
    },
  });
}

/**
 * Provide feedback
 */
export function useProvidePredictionFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      predictionId, 
      feedbackData 
    }: { 
      predictionId: string; 
      feedbackData: any;
    }) => providePredictionFeedback(predictionId, feedbackData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    },
  });
}

/**
 * Fetch training history
 */
export function useTrainingHistory(modelId: string) {
  return useQuery({
    queryKey: ['training-history', modelId],
    queryFn: () => fetchTrainingHistory(modelId),
    enabled: !!modelId,
  });
}

/**
 * Record training session
 */
export function useRecordTraining() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: recordTrainingSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-history', data.model_id] });
      queryClient.invalidateQueries({ queryKey: ['prediction-models'] });
      toast({
        title: 'تم التدريب',
        description: 'تم تسجيل جلسة التدريب بنجاح',
      });
    },
  });
}

/**
 * Fetch model accuracy metrics
 */
export function useModelAccuracyMetrics(modelId: string) {
  return useQuery({
    queryKey: ['model-accuracy', modelId],
    queryFn: () => fetchModelAccuracyMetrics(modelId),
    enabled: !!modelId,
  });
}
