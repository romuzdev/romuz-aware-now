-- ============================================================================
-- M19: Predictive Analytics - Database Schema
-- Purpose: AI-powered predictive analytics for risk, compliance, campaigns, etc.
-- Security: RLS + Transaction Logging + Backup Metadata
-- ============================================================================

-- Table 1: prediction_models
-- Stores registered prediction models and their configurations
CREATE TABLE IF NOT EXISTS public.prediction_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  model_type TEXT NOT NULL, -- 'risk', 'incident', 'compliance', 'campaign', 'audit', 'breach'
  model_name TEXT NOT NULL,
  model_version INTEGER NOT NULL DEFAULT 1,
  
  -- Model Configuration
  ai_model_provider TEXT NOT NULL DEFAULT 'lovable_ai', -- 'lovable_ai'
  ai_model_name TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  prompt_template TEXT NOT NULL,
  features_config JSONB NOT NULL DEFAULT '{}', -- Which features to use
  
  -- Performance Metrics
  accuracy_score NUMERIC(5,2),
  precision_score NUMERIC(5,2),
  recall_score NUMERIC(5,2),
  f1_score NUMERIC(5,2),
  mae NUMERIC(10,2), -- Mean Absolute Error
  rmse NUMERIC(10,2), -- Root Mean Square Error
  
  -- Status & Metadata
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'training', 'retired'
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_trained_at TIMESTAMPTZ,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  
  -- Backup & Audit
  backup_metadata JSONB,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL,
  
  CONSTRAINT unique_model_version UNIQUE(tenant_id, model_type, model_version)
);

-- Table 2: predictions
-- Stores all prediction requests and results
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.prediction_models(id) ON DELETE RESTRICT,
  
  -- Prediction Context
  prediction_type TEXT NOT NULL, -- matches model_type
  entity_id UUID, -- ID of the entity being predicted (e.g., campaign_id, risk_id)
  entity_type TEXT, -- 'campaign', 'risk', 'control', etc.
  
  -- Input Features
  input_features JSONB NOT NULL, -- All features used for prediction
  input_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prediction Output
  predicted_value NUMERIC(10,2), -- Numeric prediction (score, probability, count)
  predicted_category TEXT, -- Category prediction ('high', 'medium', 'low', etc.)
  confidence_score NUMERIC(5,2), -- 0-100
  prediction_range_min NUMERIC(10,2),
  prediction_range_max NUMERIC(10,2),
  
  -- AI Response Details
  ai_response_raw JSONB, -- Full AI response
  ai_reasoning TEXT, -- AI explanation
  ai_model_used TEXT NOT NULL,
  ai_tokens_used INTEGER,
  processing_time_ms INTEGER,
  
  -- Validation & Feedback
  actual_value NUMERIC(10,2), -- Actual outcome (filled later)
  actual_category TEXT,
  validation_status TEXT, -- 'pending', 'validated', 'incorrect'
  validation_date TIMESTAMPTZ,
  prediction_error NUMERIC(10,2), -- abs(predicted - actual)
  
  -- Status & Metadata
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'failed', 'pending'
  error_message TEXT,
  
  -- Backup & Audit
  backup_metadata JSONB,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL
);

-- Table 3: prediction_training_data
-- Historical data used for model training and improvement
CREATE TABLE IF NOT EXISTS public.prediction_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.prediction_models(id) ON DELETE CASCADE,
  
  -- Training Sample
  sample_type TEXT NOT NULL, -- 'historical', 'synthetic', 'validated'
  features JSONB NOT NULL,
  target_value NUMERIC(10,2),
  target_category TEXT,
  
  -- Sample Metadata
  sample_date TIMESTAMPTZ NOT NULL,
  sample_weight NUMERIC(5,2) DEFAULT 1.0, -- Importance weight
  is_outlier BOOLEAN DEFAULT false,
  
  -- Backup & Audit
  backup_metadata JSONB,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Table 4: model_performance_metrics
-- Tracks model performance over time
CREATE TABLE IF NOT EXISTS public.model_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.prediction_models(id) ON DELETE CASCADE,
  
  -- Evaluation Period
  evaluation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Performance Metrics
  total_predictions INTEGER NOT NULL DEFAULT 0,
  validated_predictions INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  
  accuracy NUMERIC(5,2),
  precision NUMERIC(5,2),
  recall NUMERIC(5,2),
  f1_score NUMERIC(5,2),
  mae NUMERIC(10,2),
  rmse NUMERIC(10,2),
  
  -- Distribution Analysis
  predictions_by_category JSONB, -- Count by category
  errors_by_range JSONB, -- Error distribution
  
  -- Status
  evaluation_status TEXT NOT NULL DEFAULT 'completed',
  
  -- Backup & Audit
  backup_metadata JSONB,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_prediction_models_tenant ON public.prediction_models(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prediction_models_type ON public.prediction_models(tenant_id, model_type);
CREATE INDEX IF NOT EXISTS idx_prediction_models_active ON public.prediction_models(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_predictions_tenant ON public.predictions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_predictions_model ON public.predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_predictions_entity ON public.predictions(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON public.predictions(tenant_id, prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_validation ON public.predictions(tenant_id, validation_status);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON public.predictions(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_data_tenant ON public.prediction_training_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_data_model ON public.prediction_training_data(model_id);
CREATE INDEX IF NOT EXISTS idx_training_data_date ON public.prediction_training_data(tenant_id, sample_date);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant ON public.model_performance_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_model ON public.model_performance_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON public.model_performance_metrics(tenant_id, evaluation_date DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.prediction_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance_metrics ENABLE ROW LEVEL SECURITY;

-- prediction_models policies
CREATE POLICY "Users can view their tenant's prediction models"
  ON public.prediction_models FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create prediction models"
  ON public.prediction_models FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their tenant's prediction models"
  ON public.prediction_models FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
    AND updated_by = auth.uid()
  );

-- predictions policies
CREATE POLICY "Users can view their tenant's predictions"
  ON public.predictions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create predictions"
  ON public.predictions FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their tenant's predictions"
  ON public.predictions FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
    AND updated_by = auth.uid()
  );

-- prediction_training_data policies
CREATE POLICY "Users can view their tenant's training data"
  ON public.prediction_training_data FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create training data"
  ON public.prediction_training_data FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- model_performance_metrics policies
CREATE POLICY "Users can view their tenant's performance metrics"
  ON public.model_performance_metrics FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create performance metrics"
  ON public.model_performance_metrics FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================

CREATE TRIGGER update_prediction_models_updated_at
  BEFORE UPDATE ON public.prediction_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- TRANSACTION LOGGING TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_prediction_model_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tenant_id, actor, action, entity_type, entity_id, payload)
    VALUES (
      NEW.tenant_id,
      NEW.created_by::text,
      'prediction_model.created',
      'prediction_model',
      NEW.id::text,
      jsonb_build_object(
        'model_type', NEW.model_type,
        'model_name', NEW.model_name,
        'model_version', NEW.model_version,
        'ai_model_name', NEW.ai_model_name
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tenant_id, actor, action, entity_type, entity_id, payload)
    VALUES (
      NEW.tenant_id,
      NEW.updated_by::text,
      'prediction_model.updated',
      'prediction_model',
      NEW.id::text,
      jsonb_build_object(
        'changes', jsonb_build_object(
          'status', jsonb_build_object('old', OLD.status, 'new', NEW.status),
          'is_active', jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active),
          'accuracy_score', jsonb_build_object('old', OLD.accuracy_score, 'new', NEW.accuracy_score)
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_prediction_model_changes
  AFTER INSERT OR UPDATE ON public.prediction_models
  FOR EACH ROW
  EXECUTE FUNCTION log_prediction_model_changes();

CREATE OR REPLACE FUNCTION log_prediction_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tenant_id, actor, action, entity_type, entity_id, payload)
    VALUES (
      NEW.tenant_id,
      NEW.created_by::text,
      'prediction.created',
      'prediction',
      NEW.id::text,
      jsonb_build_object(
        'prediction_type', NEW.prediction_type,
        'predicted_value', NEW.predicted_value,
        'confidence_score', NEW.confidence_score,
        'entity_type', NEW.entity_type,
        'entity_id', NEW.entity_id
      )
    );
  ELSIF TG_OP = 'UPDATE' AND (OLD.validation_status IS DISTINCT FROM NEW.validation_status) THEN
    INSERT INTO audit_log (tenant_id, actor, action, entity_type, entity_id, payload)
    VALUES (
      NEW.tenant_id,
      NEW.updated_by::text,
      'prediction.validated',
      'prediction',
      NEW.id::text,
      jsonb_build_object(
        'validation_status', NEW.validation_status,
        'actual_value', NEW.actual_value,
        'prediction_error', NEW.prediction_error
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_prediction_changes
  AFTER INSERT OR UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION log_prediction_changes();

-- ============================================================================
-- INITIAL SEED DATA (Optional)
-- ============================================================================

-- Create default prediction models for common use cases
-- Note: These will be created per tenant when they first use the feature