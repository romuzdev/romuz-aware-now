/**
 * ============================================================================
 * M19: Initialize Prediction Models
 * Purpose: Create default prediction models for a tenant
 * Security: JWT required, tenant-scoped
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getTenantId } from '../_shared/tenant-utils.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const DEFAULT_MODELS = [
  {
    model_type: 'risk',
    model_name: 'Risk Assessment Predictor',
    prompt_template: 'Analyze the following risk data and predict the risk level.',
  },
  {
    model_type: 'incident',
    model_name: 'Incident Forecast Model',
    prompt_template: 'Based on historical incident data, predict the likelihood of future incidents.',
  },
  {
    model_type: 'compliance',
    model_name: 'Compliance Score Predictor',
    prompt_template: 'Evaluate compliance posture and predict the compliance score.',
  },
  {
    model_type: 'campaign',
    model_name: 'Campaign Success Predictor',
    prompt_template: 'Analyze campaign parameters and predict success rate.',
  },
  {
    model_type: 'audit',
    model_name: 'Audit Outcome Predictor',
    prompt_template: 'Based on control maturity and findings, predict audit outcome.',
  },
  {
    model_type: 'breach',
    model_name: 'Breach Likelihood Predictor',
    prompt_template: 'Assess security posture and predict breach likelihood.',
  },
];

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
    console.log(`[init-models] Initializing models for tenant: ${tenantId}`);

    // Check if models already exist
    const { data: existing } = await supabase
      .from('prediction_models')
      .select('model_type')
      .eq('tenant_id', tenantId);

    const existingTypes = new Set(existing?.map((m) => m.model_type) || []);
    const modelsToCreate = DEFAULT_MODELS.filter((m) => !existingTypes.has(m.model_type));

    if (modelsToCreate.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All default models already exist',
          created: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create missing models
    const models = modelsToCreate.map((m) => ({
      tenant_id: tenantId,
      model_type: m.model_type,
      model_name: m.model_name,
      model_version: 1,
      ai_model_provider: 'lovable_ai',
      ai_model_name: 'google/gemini-2.5-flash',
      prompt_template: m.prompt_template,
      features_config: {},
      status: 'active',
      is_active: true,
      created_by: user.id,
      updated_by: user.id,
    }));

    const { data: created, error: insertError } = await supabase
      .from('prediction_models')
      .insert(models)
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log(`[init-models] Created ${created.length} models`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${created.length} prediction models`,
        created: created.length,
        models: created,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[init-models] Error:', error);
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
