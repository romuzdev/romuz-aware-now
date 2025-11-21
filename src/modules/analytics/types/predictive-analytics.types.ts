/**
 * M19 - Predictive Analytics Types
 */

export type PredictionType = 'risk' | 'incident' | 'compliance' | 'campaign' | 'audit' | 'breach';
export type ModelStatus = 'active' | 'training' | 'retired';
export type ValidationStatus = 'pending' | 'validated' | 'incorrect';
export type PredictionStatus = 'completed' | 'failed' | 'pending';

export interface PredictionModel {
  id: string;
  tenant_id: string;
  model_type: PredictionType;
  model_name: string;
  model_version: number;
  
  ai_model_provider: string;
  ai_model_name: string;
  prompt_template: string;
  features_config: Record<string, any>;
  
  accuracy_score: number | null;
  precision_score: number | null;
  recall_score: number | null;
  f1_score: number | null;
  mae: number | null;
  rmse: number | null;
  
  status: ModelStatus;
  is_active: boolean;
  last_trained_at: string | null;
  total_predictions: number;
  
  backup_metadata: Record<string, any> | null;
  notes: string | null;
  
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface Prediction {
  id: string;
  tenant_id: string;
  model_id: string;
  
  prediction_type: PredictionType;
  entity_id: string | null;
  entity_type: string | null;
  
  input_features: Record<string, any>;
  input_timestamp: string;
  
  predicted_value: number | null;
  predicted_category: string | null;
  confidence_score: number | null;
  prediction_range_min: number | null;
  prediction_range_max: number | null;
  
  ai_response_raw: Record<string, any> | null;
  ai_reasoning: string | null;
  ai_model_used: string;
  ai_tokens_used: number | null;
  processing_time_ms: number | null;
  
  actual_value: number | null;
  actual_category: string | null;
  validation_status: ValidationStatus;
  validation_date: string | null;
  prediction_error: number | null;
  
  status: PredictionStatus;
  error_message: string | null;
  
  backup_metadata: Record<string, any> | null;
  notes: string | null;
  
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface PredictionTrainingData {
  id: string;
  tenant_id: string;
  model_id: string;
  
  sample_type: 'historical' | 'synthetic' | 'validated';
  features: Record<string, any>;
  target_value: number | null;
  target_category: string | null;
  
  sample_date: string;
  sample_weight: number;
  is_outlier: boolean;
  
  backup_metadata: Record<string, any> | null;
  notes: string | null;
  
  created_at: string;
  created_by: string;
}

export interface ModelPerformanceMetric {
  id: string;
  tenant_id: string;
  model_id: string;
  
  evaluation_date: string;
  period_start: string;
  period_end: string;
  
  total_predictions: number;
  validated_predictions: number;
  correct_predictions: number;
  
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  mae: number | null;
  rmse: number | null;
  
  predictions_by_category: Record<string, number> | null;
  errors_by_range: Record<string, number> | null;
  
  evaluation_status: string;
  
  backup_metadata: Record<string, any> | null;
  notes: string | null;
  
  created_at: string;
  created_by: string;
}

export interface PredictionRequest {
  model_type: PredictionType;
  entity_id?: string;
  entity_type?: string;
  input_features: Record<string, any>;
  notes?: string;
}

export interface PredictionFilters {
  prediction_type?: PredictionType[];
  validation_status?: ValidationStatus[];
  date_range?: {
    from: string;
    to: string;
  };
  entity_type?: string;
  min_confidence?: number;
}

export interface ModelFilters {
  model_type?: PredictionType[];
  status?: ModelStatus[];
  is_active?: boolean;
}
