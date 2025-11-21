/**
 * M19 - Predictive Analytics Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  PredictionModel,
  Prediction,
  PredictionTrainingData,
  ModelPerformanceMetric,
  PredictionRequest,
  PredictionFilters,
  ModelFilters,
} from '../types/predictive-analytics.types';

// ============================================================================
// PREDICTION MODELS
// ============================================================================

export async function fetchPredictionModels(
  tenantId: string,
  filters?: ModelFilters
): Promise<PredictionModel[]> {
  let query = supabase
    .from('prediction_models')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.model_type?.length) {
    query = query.in('model_type', filters.model_type);
  }

  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function fetchPredictionModelById(
  modelId: string
): Promise<PredictionModel | null> {
  const { data, error } = await supabase
    .from('prediction_models')
    .select('*')
    .eq('id', modelId)
    .single();

  if (error) throw error;
  return data;
}

export async function createPredictionModel(
  model: Omit<PredictionModel, 'id' | 'created_at' | 'updated_at' | 'total_predictions'>
): Promise<PredictionModel> {
  const { data, error } = await supabase
    .from('prediction_models')
    .insert(model)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePredictionModel(
  modelId: string,
  updates: Partial<PredictionModel>
): Promise<PredictionModel> {
  const { data, error } = await supabase
    .from('prediction_models')
    .update(updates)
    .eq('id', modelId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// PREDICTIONS
// ============================================================================

export async function fetchPredictions(
  tenantId: string,
  filters?: PredictionFilters
): Promise<Prediction[]> {
  let query = supabase
    .from('predictions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.prediction_type?.length) {
    query = query.in('prediction_type', filters.prediction_type);
  }

  if (filters?.validation_status?.length) {
    query = query.in('validation_status', filters.validation_status);
  }

  if (filters?.entity_type) {
    query = query.eq('entity_type', filters.entity_type);
  }

  if (filters?.min_confidence) {
    query = query.gte('confidence_score', filters.min_confidence);
  }

  if (filters?.date_range) {
    query = query
      .gte('created_at', filters.date_range.from)
      .lte('created_at', filters.date_range.to);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function fetchPredictionById(
  predictionId: string
): Promise<Prediction | null> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('id', predictionId)
    .single();

  if (error) throw error;
  return data;
}

export async function createPrediction(
  prediction: Omit<Prediction, 'id' | 'created_at' | 'updated_at'>
): Promise<Prediction> {
  const { data, error } = await supabase
    .from('predictions')
    .insert(prediction)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePrediction(
  predictionId: string,
  updates: Partial<Prediction>
): Promise<Prediction> {
  const { data, error } = await supabase
    .from('predictions')
    .update(updates)
    .eq('id', predictionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function validatePrediction(
  predictionId: string,
  actualValue: number,
  actualCategory?: string,
  userId?: string
): Promise<Prediction> {
  const prediction = await fetchPredictionById(predictionId);
  if (!prediction) throw new Error('Prediction not found');

  const predictionError = prediction.predicted_value
    ? Math.abs(prediction.predicted_value - actualValue)
    : null;

  const updates: Partial<Prediction> = {
    actual_value: actualValue,
    actual_category: actualCategory,
    validation_status: 'validated',
    validation_date: new Date().toISOString(),
    prediction_error: predictionError,
    updated_by: userId || prediction.created_by,
  };

  return updatePrediction(predictionId, updates);
}

// ============================================================================
// TRAINING DATA
// ============================================================================

export async function fetchTrainingData(
  tenantId: string,
  modelId?: string
): Promise<PredictionTrainingData[]> {
  let query = supabase
    .from('prediction_training_data')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sample_date', { ascending: false });

  if (modelId) {
    query = query.eq('model_id', modelId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function createTrainingData(
  trainingData: Omit<PredictionTrainingData, 'id' | 'created_at'>
): Promise<PredictionTrainingData> {
  const { data, error } = await supabase
    .from('prediction_training_data')
    .insert(trainingData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export async function fetchPerformanceMetrics(
  tenantId: string,
  modelId?: string
): Promise<ModelPerformanceMetric[]> {
  let query = supabase
    .from('model_performance_metrics')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('evaluation_date', { ascending: false });

  if (modelId) {
    query = query.eq('model_id', modelId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function createPerformanceMetric(
  metric: Omit<ModelPerformanceMetric, 'id' | 'created_at'>
): Promise<ModelPerformanceMetric> {
  const { data, error } = await supabase
    .from('model_performance_metrics')
    .insert(metric)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// STATISTICS & INSIGHTS
// ============================================================================

export async function fetchPredictionStats(tenantId: string) {
  const [models, predictions] = await Promise.all([
    fetchPredictionModels(tenantId, { is_active: true }),
    fetchPredictions(tenantId),
  ]);

  const validatedPredictions = predictions.filter(
    (p) => p.validation_status === 'validated'
  );

  const highRiskPredictions = predictions.filter(
    (p) =>
      p.predicted_category === 'high' ||
      (p.predicted_value && p.predicted_value > 70)
  );

  const totalAccuracy =
    models.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) /
    (models.length || 1);

  return {
    totalModels: models.length,
    totalPredictions: predictions.length,
    validatedPredictions: validatedPredictions.length,
    highRiskPredictions: highRiskPredictions.length,
    averageAccuracy: totalAccuracy,
  };
}
