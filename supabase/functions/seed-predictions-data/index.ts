/**
 * ============================================================================
 * M19: Seed Predictive Analytics Data
 * Purpose: Create sample data for testing and demos
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getTenantId } from '../_shared/tenant-utils.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    const tenantId = await getTenantId(supabase, user.id);
    console.log(`[seed-data] Creating sample data for tenant: ${tenantId}`);

    // Get models
    const { data: models } = await supabase
      .from('prediction_models')
      .select('*')
      .eq('tenant_id', tenantId);

    if (!models || models.length === 0) {
      throw new Error('No models found. Initialize models first.');
    }

    // Create sample predictions for each model
    const predictions = [];
    const now = new Date();

    for (const model of models) {
      // Create 10 predictions per model over the last 30 days
      for (let i = 0; i < 10; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        
        const predictedValue = 20 + Math.random() * 60; // 20-80
        const category = 
          predictedValue < 40 ? 'low' :
          predictedValue < 60 ? 'medium' :
          predictedValue < 80 ? 'high' : 'critical';
        
        const confidence = 60 + Math.random() * 30; // 60-90%
        
        // Some predictions are validated
        const isValidated = Math.random() > 0.5;
        const actualValue = isValidated 
          ? predictedValue + (Math.random() - 0.5) * 20 // Within ±10
          : null;

        predictions.push({
          tenant_id: tenantId,
          model_id: model.id,
          prediction_type: model.model_type,
          entity_type: getEntityType(model.model_type),
          input_features: generateInputFeatures(model.model_type),
          predicted_value: predictedValue,
          predicted_category: category,
          confidence_score: confidence,
          prediction_range_min: predictedValue - 10,
          prediction_range_max: predictedValue + 10,
          ai_response_raw: { sample: true },
          ai_reasoning: generateReasoning(model.model_type, predictedValue, category),
          ai_model_used: model.ai_model_name,
          ai_tokens_used: 150 + Math.floor(Math.random() * 100),
          processing_time_ms: 500 + Math.floor(Math.random() * 1000),
          actual_value: actualValue,
          actual_category: actualValue ? (
            actualValue < 40 ? 'low' :
            actualValue < 60 ? 'medium' :
            actualValue < 80 ? 'high' : 'critical'
          ) : null,
          validation_status: isValidated ? 'validated' : 'pending',
          validation_date: isValidated ? new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          prediction_error: actualValue ? Math.abs(predictedValue - actualValue) : null,
          status: 'completed',
          created_at: createdAt.toISOString(),
          created_by: user.id,
          updated_at: createdAt.toISOString(),
          updated_by: user.id,
        });
      }
    }

    // Insert predictions
    const { error: predError } = await supabase
      .from('predictions')
      .insert(predictions);

    if (predError) {
      throw predError;
    }

    // Update model stats
    for (const model of models) {
      await supabase
        .from('prediction_models')
        .update({
          total_predictions: 10,
          accuracy_score: 75 + Math.random() * 20,
          precision_score: 70 + Math.random() * 25,
          recall_score: 72 + Math.random() * 23,
          f1_score: 73 + Math.random() * 22,
          mae: 5 + Math.random() * 10,
          rmse: 7 + Math.random() * 12,
          last_trained_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('id', model.id);
    }

    // Create performance metrics
    const metrics = models.map((model) => ({
      tenant_id: tenantId,
      model_id: model.id,
      evaluation_date: new Date().toISOString(),
      period_start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString(),
      total_predictions: 10,
      validated_predictions: 5,
      correct_predictions: 4,
      accuracy: 75 + Math.random() * 20,
      precision: 70 + Math.random() * 25,
      recall: 72 + Math.random() * 23,
      f1_score: 73 + Math.random() * 22,
      mae: 5 + Math.random() * 10,
      rmse: 7 + Math.random() * 12,
      predictions_by_category: {
        low: 2,
        medium: 4,
        high: 3,
        critical: 1,
      },
      errors_by_range: {
        '0-5': 3,
        '5-10': 1,
        '10-15': 1,
      },
      evaluation_status: 'completed',
      created_at: new Date().toISOString(),
      created_by: user.id,
    }));

    const { error: metricsError } = await supabase
      .from('model_performance_metrics')
      .insert(metrics);

    if (metricsError) {
      throw metricsError;
    }

    console.log(`[seed-data] Created ${predictions.length} predictions and ${metrics.length} metrics`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sample data created successfully',
        predictions: predictions.length,
        metrics: metrics.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[seed-data] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getEntityType(modelType: string): string {
  const types: Record<string, string> = {
    risk: 'risk_assessment',
    incident: 'security_incident',
    compliance: 'compliance_check',
    campaign: 'awareness_campaign',
    audit: 'audit',
    breach: 'breach_scenario',
  };
  return types[modelType] || 'unknown';
}

function generateInputFeatures(modelType: string): Record<string, any> {
  const features: Record<string, Record<string, any>> = {
    risk: {
      threat_level: Math.floor(Math.random() * 5) + 1,
      vulnerability_count: Math.floor(Math.random() * 20),
      control_effectiveness: Math.random() * 100,
      recent_incidents: Math.floor(Math.random() * 10),
    },
    incident: {
      historical_incidents: Math.floor(Math.random() * 50),
      threat_intelligence_score: Math.random() * 100,
      security_posture: Math.random() * 100,
      time_period: '30_days',
    },
    compliance: {
      controls_implemented: Math.floor(Math.random() * 100),
      controls_total: 150,
      last_audit_score: 60 + Math.random() * 35,
      policy_adherence: Math.random() * 100,
    },
    campaign: {
      target_audience_size: 100 + Math.floor(Math.random() * 500),
      content_quality_score: 60 + Math.random() * 40,
      timing_score: Math.random() * 100,
      previous_campaigns_avg: 50 + Math.random() * 40,
    },
    audit: {
      control_maturity: Math.random() * 100,
      historical_findings: Math.floor(Math.random() * 30),
      remediation_rate: Math.random() * 100,
      documentation_quality: 60 + Math.random() * 40,
    },
    breach: {
      security_score: Math.random() * 100,
      vulnerabilities: Math.floor(Math.random() * 50),
      threat_exposure: Math.random() * 100,
      incident_history: Math.floor(Math.random() * 20),
    },
  };
  return features[modelType] || {};
}

function generateReasoning(modelType: string, value: number, category: string): string {
  const reasons: Record<string, string[]> = {
    risk: [
      'Based on threat intelligence and vulnerability assessment',
      'Historical incident patterns suggest elevated risk',
      'Control effectiveness analysis indicates moderate risk',
      'Combined threat and vulnerability factors point to',
    ],
    incident: [
      'Historical incident frequency suggests',
      'Current threat landscape indicates',
      'Security posture analysis shows',
      'Pattern recognition from past incidents reveals',
    ],
    compliance: [
      'Control implementation rate indicates',
      'Policy adherence metrics suggest',
      'Audit history shows',
      'Compliance maturity assessment reveals',
    ],
    campaign: [
      'Target audience engagement potential suggests',
      'Content quality and timing analysis indicates',
      'Historical campaign performance shows',
      'Audience receptiveness metrics point to',
    ],
    audit: [
      'Control maturity evaluation suggests',
      'Historical audit findings indicate',
      'Documentation and remediation rates show',
      'Overall preparedness assessment reveals',
    ],
    breach: [
      'Security posture analysis indicates',
      'Vulnerability and threat exposure suggests',
      'Incident history patterns show',
      'Combined risk factors point to',
    ],
  };

  const templates = reasons[modelType] || ['Analysis indicates'];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return `${template} a ${category} risk level with a predicted score of ${value.toFixed(1)}. Key contributing factors include current security posture, historical trends, and threat intelligence data.`;
}
