/**
 * M19: Run Prediction
 * Execute prediction using trained model
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RunPredictionRequest {
  modelId: string;
  contextType: string;
  contextId: string;
  inputData?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { modelId, contextType, contextId, inputData }: RunPredictionRequest = await req.json();

    if (!modelId || !contextType) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Run Prediction] Model: ${modelId}, Context: ${contextType}/${contextId}`);

    // 1. Fetch model
    const { data: model, error: modelError } = await supabase
      .from('prediction_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      return new Response(
        JSON.stringify({ error: 'Model not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!model.is_active) {
      return new Response(
        JSON.stringify({ error: 'Model is inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch context data
    const contextData = inputData || await fetchContextData(supabase, contextType, contextId);

    // 3. Run prediction using Lovable AI
    const prediction = await runPredictionWithAI(model, contextData, contextType);

    // 4. Save prediction result
    const { data: result, error: saveError } = await supabase
      .from('prediction_results')
      .insert({
        model_id: modelId,
        tenant_id: model.tenant_id,
        context_type: contextType,
        context_id: contextId,
        predicted_value: prediction.value,
        confidence_score: prediction.confidence,
        prediction_date: new Date().toISOString(),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (saveError) {
      console.error('[Run Prediction] Failed to save:', saveError);
    }

    // 5. Check if alert should be created
    if (prediction.shouldAlert) {
      await createPredictionAlert(supabase, result, prediction, model.tenant_id);
    }

    console.log(`[Run Prediction] Completed with confidence ${prediction.confidence}`);

    return new Response(
      JSON.stringify({
        success: true,
        prediction: result,
        confidence: prediction.confidence,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Run Prediction] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Fetch context data
 */
async function fetchContextData(supabase: any, contextType: string, contextId: string) {
  const tableMap: Record<string, string> = {
    'risk': 'grc_risks',
    'incident': 'security_incidents',
    'compliance': 'compliance_obligations',
    'campaign': 'awareness_campaigns',
    'user': 'profiles',
  };

  const table = tableMap[contextType];
  if (!table) throw new Error(`Unknown context type: ${contextType}`);

  const { data } = await supabase
    .from(table)
    .select('*')
    .eq('id', contextId)
    .single();

  return data;
}

/**
 * Run prediction using Lovable AI
 */
async function runPredictionWithAI(
  model: any,
  contextData: any,
  contextType: string
): Promise<{
  value: any;
  confidence: number;
  shouldAlert: boolean;
  alertSeverity?: string;
}> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a predictive analytics AI. Analyze data and make predictions.
Return predictions in JSON format: { predicted_value, confidence, should_alert, alert_severity }`,
        },
        {
          role: 'user',
          content: `Make a ${model.model_type} prediction based on this data:
${JSON.stringify(contextData, null, 2)}

Provide:
1. Predicted value (numeric or categorical)
2. Confidence score (0-1)
3. Whether this requires an alert (boolean)
4. Alert severity if applicable (low/medium/high/critical)`,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('Payment required. Please add credits to your workspace.');
    }
    throw new Error(`AI prediction failed: ${response.statusText}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;

  // Parse prediction from AI response
  try {
    const predictionMatch = content.match(/\{[\s\S]*\}/);
    if (predictionMatch) {
      const parsed = JSON.parse(predictionMatch[0]);
      return {
        value: parsed.predicted_value || {},
        confidence: parsed.confidence || 0.7,
        shouldAlert: parsed.should_alert || false,
        alertSeverity: parsed.alert_severity || 'medium',
      };
    }
  } catch (e) {
    console.log('[Prediction] Using default values due to parse error');
  }

  // Default prediction
  return {
    value: { prediction: 'pending' },
    confidence: 0.7,
    shouldAlert: false,
  };
}

/**
 * Create prediction alert
 */
async function createPredictionAlert(
  supabase: any,
  prediction: any,
  aiResult: any,
  tenantId: string
) {
  await supabase.from('prediction_alerts').insert({
    tenant_id: tenantId,
    prediction_id: prediction.id,
    alert_type: determineAlertType(prediction.context_type, aiResult),
    severity: aiResult.alertSeverity,
    title_ar: `تنبيه: ${getAlertTitleAr(prediction.context_type)}`,
    title_en: `Alert: ${getAlertTitleEn(prediction.context_type)}`,
    description_ar: 'تنبؤ يتطلب انتباهًا',
    description_en: 'Prediction requires attention',
    notified_users: [],
    status: 'active',
  });
}

function determineAlertType(contextType: string, aiResult: any): string {
  const typeMap: Record<string, string> = {
    'risk': 'high_risk_predicted',
    'incident': 'incident_imminent',
    'compliance': 'compliance_drift',
    'campaign': 'campaign_failure',
  };
  return typeMap[contextType] || 'anomaly_detected';
}

function getAlertTitleAr(contextType: string): string {
  const titles: Record<string, string> = {
    'risk': 'خطر مرتفع متوقع',
    'incident': 'حادثة وشيكة',
    'compliance': 'انحراف في الامتثال',
    'campaign': 'فشل حملة محتمل',
  };
  return titles[contextType] || 'شذوذ مكتشف';
}

function getAlertTitleEn(contextType: string): string {
  const titles: Record<string, string> = {
    'risk': 'High Risk Predicted',
    'incident': 'Incident Imminent',
    'compliance': 'Compliance Drift',
    'campaign': 'Campaign Failure',
  };
  return titles[contextType] || 'Anomaly Detected';
}
