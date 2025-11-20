/**
 * ============================================================================
 * M16: AI Advisory Engine - Edge Function
 * Purpose: Generate AI-powered recommendations using Lovable AI
 * Model: google/gemini-2.5-flash (default)
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface AdvisoryRequest {
  context_type: 'risk' | 'compliance' | 'audit' | 'campaign' | 'policy' | 'action_plan' | 'incident' | 'security_event';
  context_id: string;
  context_data?: any;
  language?: 'ar' | 'en' | 'both';
  tenant_id: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Lovable AI key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Parse request
    const { context_type, context_id, context_data, language = 'both', tenant_id }: AdvisoryRequest = await req.json();

    console.log('AI Advisory Request:', { context_type, context_id, language, tenant_id });

    // Validate tenant
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Build context-specific prompt
    const systemPrompt = buildSystemPrompt(context_type, language);
    const userPrompt = buildUserPrompt(context_type, context_data, language);

    console.log('Calling Lovable AI...');
    const startTime = Date.now();

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const processingTime = Date.now() - startTime;

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('معدل الطلبات تجاوز الحد المسموح. يرجى المحاولة لاحقاً.');
      }
      if (aiResponse.status === 402) {
        throw new Error('يجب إضافة رصيد إلى حساب Lovable AI.');
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const recommendation = aiData.choices?.[0]?.message?.content;

    if (!recommendation) {
      throw new Error('No recommendation generated');
    }

    console.log('AI recommendation generated successfully');

    // Parse recommendation (expecting structured JSON)
    const parsedRecommendation = parseAIRecommendation(recommendation, language);

    // Calculate confidence and priority
    const confidence = calculateConfidence(parsedRecommendation);
    const priority = determinePriority(context_type, confidence, parsedRecommendation);

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save recommendation to database
    const { data: savedRec, error: saveError } = await supabase
      .from('ai_recommendations')
      .insert({
        tenant_id,
        context_type,
        context_id,
        context_snapshot: context_data,
        title_ar: parsedRecommendation.title_ar,
        title_en: parsedRecommendation.title_en,
        description_ar: parsedRecommendation.description_ar,
        description_en: parsedRecommendation.description_en,
        rationale_ar: parsedRecommendation.rationale_ar,
        rationale_en: parsedRecommendation.rationale_en,
        model_used: 'google/gemini-2.5-flash',
        confidence_score: confidence,
        priority,
        category: parsedRecommendation.category || context_type,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        tags: parsedRecommendation.tags || [],
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving recommendation:', saveError);
      throw saveError;
    }

    // Log decision
    await supabase.from('ai_decision_logs').insert({
      tenant_id,
      recommendation_id: savedRec.id,
      context_type,
      context_id,
      decision_type: 'recommendation_generated',
      model_used: 'google/gemini-2.5-flash',
      prompt_used: userPrompt,
      response_received: recommendation,
      tokens_used: aiData.usage?.total_tokens || null,
      processing_time_ms: processingTime,
      confidence_score: confidence,
      outcome: 'success',
      outcome_details: { priority, expires_at: expiresAt.toISOString() },
    });

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: savedRec,
        processing_time_ms: processingTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('AI Advisory error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'فشل في توليد التوصية',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Build system prompt based on context type and language
 */
function buildSystemPrompt(contextType: string, language: string): string {
  const basePrompt = `أنت مستشار ذكاء اصطناعي متخصص في الحوكمة والمخاطر والامتثال (GRC) وأمن المعلومات.
مهمتك تقديم توصيات عملية واحترافية بناءً على السياق المقدم.

You are an AI advisor specialized in Governance, Risk & Compliance (GRC) and Information Security.
Your task is to provide practical and professional recommendations based on the provided context.`;

  const contextPrompts: Record<string, string> = {
    risk: 'قدم توصيات لتخفيف المخاطر وتحسين إدارة المخاطر. / Provide risk mitigation and risk management recommendations.',
    compliance: 'قدم توصيات للامتثال التنظيمي وتحسين الضوابط. / Provide compliance and control improvement recommendations.',
    audit: 'قدم توصيات لتحسين نتائج المراجعة ومعالجة النتائج. / Provide audit findings remediation recommendations.',
    campaign: 'قدم توصيات لتحسين فعالية حملات التوعية. / Provide awareness campaign effectiveness recommendations.',
    policy: 'قدم توصيات لتحسين السياسات والإجراءات. / Provide policy and procedure improvement recommendations.',
    action_plan: 'قدم توصيات لتسريع خطط العمل وإزالة العوائق. / Provide action plan acceleration recommendations.',
    incident: 'قدم توصيات للتعامل مع الحوادث والوقاية منها. / Provide incident response and prevention recommendations.',
    security_event: 'قدم توصيات أمنية عاجلة. / Provide urgent security recommendations.',
  };

  const outputFormat = language === 'both' 
    ? `
**يجب أن يكون الرد بصيغة JSON التالية بالضبط:**
{
  "title_ar": "عنوان التوصية بالعربية",
  "title_en": "Recommendation Title in English",
  "description_ar": "وصف تفصيلي للتوصية بالعربية (2-3 فقرات)",
  "description_en": "Detailed recommendation description in English (2-3 paragraphs)",
  "rationale_ar": "السبب والمنطق وراء هذه التوصية بالعربية",
  "rationale_en": "Rationale and reasoning behind this recommendation in English",
  "category": "category_name",
  "tags": ["tag1", "tag2", "tag3"]
}`
    : language === 'ar'
    ? `
**يجب أن يكون الرد بصيغة JSON التالية بالضبط (بالعربية فقط):**
{
  "title_ar": "عنوان التوصية",
  "description_ar": "وصف تفصيلي للتوصية (2-3 فقرات)",
  "rationale_ar": "السبب والمنطق وراء هذه التوصية",
  "category": "category_name",
  "tags": ["tag1", "tag2", "tag3"]
}`
    : `
**Response must be in this exact JSON format (English only):**
{
  "title_en": "Recommendation Title",
  "description_en": "Detailed recommendation description (2-3 paragraphs)",
  "rationale_en": "Rationale and reasoning behind this recommendation",
  "category": "category_name",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  return `${basePrompt}\n\n${contextPrompts[contextType] || contextPrompts.risk}\n\n${outputFormat}`;
}

/**
 * Build user prompt with context data
 */
function buildUserPrompt(contextType: string, contextData: any, language: string): string {
  const intro = language === 'ar' 
    ? 'بناءً على المعلومات التالية، قدم توصية عملية:'
    : language === 'en'
    ? 'Based on the following information, provide a practical recommendation:'
    : 'بناءً على المعلومات التالية، قدم توصية عملية: / Based on the following information, provide a practical recommendation:';

  const contextStr = JSON.stringify(contextData, null, 2);
  
  return `${intro}\n\n\`\`\`json\n${contextStr}\n\`\`\``;
}

/**
 * Parse AI recommendation from response
 */
function parseAIRecommendation(response: string, language: string): any {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try direct JSON parse
    return JSON.parse(response);
  } catch (error) {
    console.warn('Failed to parse AI response as JSON, using fallback');
    
    // Fallback: create structured response from text
    return {
      title_ar: language === 'ar' || language === 'both' ? 'توصية ذكية' : null,
      title_en: language === 'en' || language === 'both' ? 'Smart Recommendation' : null,
      description_ar: language === 'ar' || language === 'both' ? response.substring(0, 500) : null,
      description_en: language === 'en' || language === 'both' ? response.substring(0, 500) : null,
      rationale_ar: null,
      rationale_en: null,
      category: 'general',
      tags: [],
    };
  }
}

/**
 * Calculate confidence score based on recommendation quality
 */
function calculateConfidence(recommendation: any): number {
  let score = 0.5; // Base score
  
  // Has detailed description
  if (recommendation.description_ar?.length > 100 || recommendation.description_en?.length > 100) {
    score += 0.2;
  }
  
  // Has rationale
  if (recommendation.rationale_ar || recommendation.rationale_en) {
    score += 0.15;
  }
  
  // Has category
  if (recommendation.category) {
    score += 0.1;
  }
  
  // Has tags
  if (recommendation.tags?.length > 0) {
    score += 0.05;
  }
  
  return Math.min(Math.max(score, 0.3), 1.0); // Clamp between 0.3 and 1.0
}

/**
 * Determine priority based on context and confidence
 */
function determinePriority(contextType: string, confidence: number, recommendation: any): string {
  // High priority contexts
  if (['security_event', 'incident'].includes(contextType)) {
    return confidence > 0.7 ? 'critical' : 'high';
  }
  
  // Medium-high priority contexts
  if (['risk', 'compliance', 'audit'].includes(contextType)) {
    return confidence > 0.8 ? 'high' : 'medium';
  }
  
  // Standard priority
  return confidence > 0.7 ? 'medium' : 'low';
}
