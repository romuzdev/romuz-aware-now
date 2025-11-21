/**
 * M17: Knowledge Hub + RAG - Edge Function
 * Function: knowledge-rag
 * Purpose: Generate AI answers using Retrieval-Augmented Generation
 * 
 * This function receives a question and relevant context chunks,
 * then uses Lovable AI to generate an accurate, contextual answer.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RAGRequest {
  question: string;
  context: string;
  language?: 'ar' | 'en';
  sources?: Array<{ article_id: string; title: string }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 knowledge-rag: Starting RAG query processing');
    
    const {
      question,
      context,
      language = 'ar',
      sources = [],
    }: RAGRequest = await req.json();

    if (!question || question.trim().length === 0) {
      throw new Error('Question is required and cannot be empty');
    }

    if (!context || context.trim().length === 0) {
      throw new Error('Context is required and cannot be empty');
    }

    // Get Lovable AI API Key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`📝 Processing question: "${question.substring(0, 50)}..." (Language: ${language})`);

    // Prepare system prompt based on language
    const systemPrompt = language === 'ar'
      ? `أنت مساعد ذكي متخصص في الإجابة على الأسئلة بناءً على قاعدة المعرفة المتاحة.

قواعد الإجابة:
1. استخدم فقط المعلومات الموجودة في السياق المُقدم
2. أجب بشكل دقيق ومباشر على السؤال
3. إذا لم تجد الإجابة في السياق، قل ذلك بوضوح
4. اذكر المصادر التي استخدمتها في إجابتك
5. استخدم اللغة العربية الفصحى
6. اجعل الإجابة واضحة ومفهومة`
      : `You are an intelligent assistant specialized in answering questions based on the available knowledge base.

Answer guidelines:
1. Use only the information provided in the context
2. Answer accurately and directly to the question
3. If you don't find the answer in the context, state that clearly
4. Mention the sources you used in your answer
5. Use clear and professional English
6. Make the answer clear and understandable`;

    const userPrompt = language === 'ar'
      ? `السؤال: ${question}

السياق المتاح:
${context}

المصادر:
${sources.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}

الرجاء تقديم إجابة شاملة ودقيقة بناءً على السياق المُقدم.`
      : `Question: ${question}

Available Context:
${context}

Sources:
${sources.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}

Please provide a comprehensive and accurate answer based on the provided context.`;

    // Call Lovable AI for RAG response
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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more focused, factual answers
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Lovable AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0]?.message?.content;

    if (!answer) {
      throw new Error('Failed to generate answer from AI');
    }

    console.log(`✅ Successfully generated RAG answer (${answer.length} characters)`);

    // Calculate confidence score based on context similarity and answer quality
    const confidence = calculateConfidence(question, context, answer);

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        confidence,
        model: 'google/gemini-2.5-flash',
        sources: sources.map(s => s.article_id),
        language,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in knowledge-rag:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Calculate confidence score for the RAG answer
 */
function calculateConfidence(question: string, context: string, answer: string): number {
  // Simple heuristic-based confidence calculation
  let confidence = 0.5; // Base confidence

  // Higher confidence if answer is longer and more detailed
  if (answer.length > 200) confidence += 0.1;
  if (answer.length > 500) confidence += 0.1;

  // Higher confidence if context is substantial
  if (context.length > 500) confidence += 0.1;
  if (context.length > 1000) confidence += 0.1;

  // Lower confidence if answer contains uncertainty phrases
  const uncertaintyPhrases = [
    'لا أعلم',
    'غير متأكد',
    'لا أستطيع',
    'لا أجد',
    "I don't know",
    'not sure',
    'cannot find',
  ];

  const hasUncertainty = uncertaintyPhrases.some(phrase =>
    answer.toLowerCase().includes(phrase.toLowerCase())
  );

  if (hasUncertainty) confidence -= 0.2;

  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}
