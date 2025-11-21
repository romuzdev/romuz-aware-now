/**
 * ============================================================================
 * M19: Predictive Analytics - Create Prediction Edge Function
 * Purpose: Generate AI-powered predictions using Lovable AI
 * Security: JWT required, tenant-scoped
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getTenantId } from '../_shared/tenant-utils.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

interface PredictionRequest {
  model_type: string;
  entity_id?: string;
  entity_type?: string;
  input_features: Record<string, any>;
  notes?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Get authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    // Get tenant
    const tenantId = await getTenantId(supabase, user.id);
    console.log(`[create-prediction] User: ${user.id}, Tenant: ${tenantId}`);

    // Parse request
    const body: PredictionRequest = await req.json();
    const { model_type, entity_id, entity_type, input_features, notes } = body;

    console.log(`[create-prediction] Request: ${model_type}, entity: ${entity_type}/${entity_id}`);

    // Find active model for this type
    const { data: model, error: modelError } = await supabase
      .from('prediction_models')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('model_type', model_type)
      .eq('is_active', true)
      .single();

    if (modelError || !model) {
      throw new Error(`No active prediction model found for type: ${model_type}`);
    }

    console.log(`[create-prediction] Using model: ${model.model_name} (v${model.model_version})`);

    // Build prompt from template
    const prompt = buildPrompt(model.prompt_template, input_features, model_type);
    
    // Call Lovable AI
    console.log(`[create-prediction] Calling AI model: ${model.ai_model_name}`);
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.ai_model_name || 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert predictive analytics AI. Analyze the provided data and make accurate predictions with confidence scores.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'make_prediction',
              description: 'Make a prediction based on the analyzed data',
              parameters: {
                type: 'object',
                properties: {
                  predicted_value: {
                    type: 'number',
                    description: 'The predicted numeric value (0-100 scale)',
                  },
                  predicted_category: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'critical'],
                    description: 'The predicted category',
                  },
                  confidence_score: {
                    type: 'number',
                    description: 'Confidence in the prediction (0-100)',
                  },
                  prediction_range_min: {
                    type: 'number',
                    description: 'Lower bound of prediction range',
                  },
                  prediction_range_max: {
                    type: 'number',
                    description: 'Upper bound of prediction range',
                  },
                  reasoning: {
                    type: 'string',
                    description: 'Detailed explanation of the prediction',
                  },
                  key_factors: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Key factors influencing the prediction',
                  },
                },
                required: [
                  'predicted_value',
                  'predicted_category',
                  'confidence_score',
                  'reasoning',
                ],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'make_prediction' } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[create-prediction] AI API Error: ${aiResponse.status} - ${errorText}`);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log(`[create-prediction] AI response received`);

    // Extract prediction from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'make_prediction') {
      throw new Error('Invalid AI response format');
    }

    const predictionData = JSON.parse(toolCall.function.arguments);
    const processingTime = Date.now() - startTime;

    // Save prediction to database
    const { data: prediction, error: insertError } = await supabase
      .from('predictions')
      .insert({
        tenant_id: tenantId,
        model_id: model.id,
        prediction_type: model_type,
        entity_id: entity_id || null,
        entity_type: entity_type || null,
        input_features,
        predicted_value: predictionData.predicted_value,
        predicted_category: predictionData.predicted_category,
        confidence_score: predictionData.confidence_score,
        prediction_range_min: predictionData.prediction_range_min || null,
        prediction_range_max: predictionData.prediction_range_max || null,
        ai_response_raw: aiData,
        ai_reasoning: predictionData.reasoning,
        ai_model_used: model.ai_model_name,
        ai_tokens_used: aiData.usage?.total_tokens || null,
        processing_time_ms: processingTime,
        validation_status: 'pending',
        status: 'completed',
        notes: notes || null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[create-prediction] Database error:', insertError);
      throw insertError;
    }

    // Update model stats
    await supabase
      .from('prediction_models')
      .update({
        total_predictions: model.total_predictions + 1,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', model.id);

    console.log(`[create-prediction] Success: Prediction ${prediction.id} created`);

    return new Response(
      JSON.stringify({
        success: true,
        prediction,
        key_factors: predictionData.key_factors || [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[create-prediction] Error:', error);
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

function buildPrompt(
  template: string,
  features: Record<string, any>,
  modelType: string
): string {
  // Replace placeholders in template
  let prompt = template;
  
  // Add features as context
  prompt += '\n\n## Input Data:\n';
  for (const [key, value] of Object.entries(features)) {
    prompt += `- ${key}: ${JSON.stringify(value)}\n`;
  }

  // Add model-specific instructions
  const typeInstructions: Record<string, string> = {
    risk: 'Focus on security risks, threats, and vulnerabilities. Consider likelihood and impact.',
    incident: 'Predict the likelihood of security incidents based on historical patterns and current threats.',
    compliance: 'Assess compliance score based on control effectiveness and policy adherence.',
    campaign: 'Predict campaign success based on target audience, content quality, and timing.',
    audit: 'Predict audit outcome based on control maturity and historical findings.',
    breach: 'Assess the likelihood of a data breach based on security posture and threat landscape.',
  };

  if (typeInstructions[modelType]) {
    prompt += `\n\n## Prediction Focus:\n${typeInstructions[modelType]}`;
  }

  prompt += '\n\n## Instructions:\n';
  prompt += '1. Analyze the provided data carefully\n';
  prompt += '2. Make a prediction on a 0-100 scale\n';
  prompt += '3. Categorize as low (<40), medium (40-60), high (60-80), or critical (>80)\n';
  prompt += '4. Provide confidence score (0-100) based on data quality and completeness\n';
  prompt += '5. Explain your reasoning clearly\n';
  prompt += '6. List the key factors that influenced your prediction\n';

  return prompt;
}
