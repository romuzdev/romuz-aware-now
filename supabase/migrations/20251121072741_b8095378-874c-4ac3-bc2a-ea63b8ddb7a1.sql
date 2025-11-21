
-- Fix audit triggers for prediction tables
-- Issue: Casting UUID to text causes type mismatch with audit_log.actor column

-- 1. Fix log_prediction_model_changes function
CREATE OR REPLACE FUNCTION log_prediction_model_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tenant_id, actor, action, entity_type, entity_id, payload)
    VALUES (
      NEW.tenant_id,
      NEW.created_by,  -- Changed from NEW.created_by::text to NEW.created_by
      'prediction_model.created',
      'prediction_model',
      NEW.id,
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
      NEW.updated_by,  -- Changed from NEW.updated_by::text to NEW.updated_by
      'prediction_model.updated',
      'prediction_model',
      NEW.id,
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

-- 2. Fix log_prediction_changes function
CREATE OR REPLACE FUNCTION log_prediction_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tenant_id, actor, action, entity_type, entity_id, payload)
    VALUES (
      NEW.tenant_id,
      NEW.created_by,  -- Changed from NEW.created_by::text to NEW.created_by
      'prediction.created',
      'prediction',
      NEW.id,
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
      NEW.updated_by,  -- Changed from NEW.updated_by::text to NEW.updated_by
      'prediction.validated',
      'prediction',
      NEW.id,
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
