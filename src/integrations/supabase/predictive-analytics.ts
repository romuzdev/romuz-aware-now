/**
 * M19: Predictive Analytics - Integration Layer
 * ML models, predictions, and analytics
 */

import { supabase } from './client';
import type { Database } from './types';

type PredictionModel = Database['public']['Tables']['prediction_models']['Row'];
type PredictionResult = Database['public']['Tables']['prediction_results']['Row'];
type TrainingHistory = Database['public']['Tables']['model_training_history']['Row'];
type PredictionAlert = Database['public']['Tables']['prediction_alerts']['Row'];

/**
 * Fetch all prediction models
 */
export async function fetchPredictionModels(filters?: {
  modelType?: string;
  isActive?: boolean;
}): Promise<PredictionModel[]> {
  let query = supabase
    .from('prediction_models')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.modelType) {
    query = query.eq('model_type', filters.modelType);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch model by ID
 */
export async function fetchModelById(id: string): Promise<PredictionModel> {
  const { data, error } = await supabase
    .from('prediction_models')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch predictions by model
 */
export async function fetchPredictionsByModel(
  modelId: string,
  limit: number = 50
): Promise<PredictionResult[]> {
  const { data, error } = await supabase
    .from('prediction_results')
    .select('*')
    .eq('model_id', modelId)
    .order('prediction_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Fetch predictions by context
 */
export async function fetchPredictionsByContext(
  contextType: string,
  contextId: string
): Promise<PredictionResult[]> {
  const { data, error } = await supabase
    .from('prediction_results')
    .select('*')
    .eq('context_type', contextType)
    .eq('context_id', contextId)
    .order('prediction_date', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Create prediction result
 */
export async function createPrediction(
  prediction: Omit<PredictionResult, 'id' | 'created_at' | 'last_backed_up_at'>
): Promise<PredictionResult> {
  const { data, error } = await supabase
    .from('prediction_results')
    .insert(prediction)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update prediction with actual value
 */
export async function recordActualValue(
  predictionId: string,
  actualValue: any,
  accuracyDelta: number
): Promise<void> {
  const { error } = await supabase
    .from('prediction_results')
    .update({
      actual_value: actualValue,
      actual_recorded_at: new Date().toISOString(),
      accuracy_delta: accuracyDelta,
    })
    .eq('id', predictionId);

  if (error) throw error;
}

/**
 * Provide feedback on prediction
 */
export async function providePredictionFeedback(
  predictionId: string,
  feedbackData: any
): Promise<void> {
  const { error } = await supabase
    .from('prediction_results')
    .update({
      feedback_provided: true,
      feedback_data: feedbackData,
    })
    .eq('id', predictionId);

  if (error) throw error;
}

/**
 * Fetch training history for model
 */
export async function fetchTrainingHistory(modelId: string): Promise<TrainingHistory[]> {
  const { data, error } = await supabase
    .from('model_training_history')
    .select('*')
    .eq('model_id', modelId)
    .order('training_date', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Record training session
 */
export async function recordTrainingSession(
  training: Omit<TrainingHistory, 'id' | 'created_at' | 'last_backed_up_at'>
): Promise<TrainingHistory> {
  const { data, error } = await supabase
    .from('model_training_history')
    .insert(training)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch prediction alerts
 */
export async function fetchPredictionAlerts(filters?: {
  status?: string;
  severity?: string;
}): Promise<PredictionAlert[]> {
  let query = supabase
    .from('prediction_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Create prediction alert
 */
export async function createPredictionAlert(
  alert: Omit<PredictionAlert, 'id' | 'created_at' | 'last_backed_up_at'>
): Promise<PredictionAlert> {
  const { data, error } = await supabase
    .from('prediction_alerts')
    .insert(alert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Acknowledge alert
 */
export async function acknowledgePredictionAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('prediction_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) throw error;
}

/**
 * Fetch model accuracy metrics
 */
export async function fetchModelAccuracyMetrics(modelId: string): Promise<{
  avgAccuracy: number;
  totalPredictions: number;
  accuracyTrend: Array<{ date: string; accuracy: number }>;
}> {
  const { data, error } = await supabase
    .from('prediction_results')
    .select('prediction_date, accuracy_delta')
    .eq('model_id', modelId)
    .not('accuracy_delta', 'is', null)
    .order('prediction_date', { ascending: true });

  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      avgAccuracy: 0,
      totalPredictions: 0,
      accuracyTrend: [],
    };
  }

  const avgAccuracy = data.reduce((sum, p) => sum + (p.accuracy_delta || 0), 0) / data.length;
  
  return {
    avgAccuracy: Math.abs(avgAccuracy),
    totalPredictions: data.length,
    accuracyTrend: data.map(p => ({
      date: p.prediction_date,
      accuracy: Math.abs(p.accuracy_delta || 0),
    })),
  };
}
