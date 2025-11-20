/**
 * M17: Knowledge Hub + RAG - Edge Function
 * Function: knowledge-qa
 * Purpose: RAG (Retrieval-Augmented Generation) Q&A System
 * 
 * This function implements intelligent question-answering by:
 * 1. Finding relevant documents using semantic search
 * 2. Using those documents as context for AI to generate accurate answers
 * 3. Storing Q&A pairs for future reference and improvement
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QARequest {
  question: string;
  language?: 'ar' | 'en';
  maxSources?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💬 knowledge-qa: Starting RAG Q&A');
    
    const {
      question,
      language = 'ar',
      maxSources = 5,
    }: QARequest = await req.json();

    if (!question || question.trim().length === 0) {
      throw new Error('Question is required and cannot be empty');
    }

    // Get authorization token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`👤 User: ${user.id}, Question: "${question.substring(0, 50)}..."`);

    // Get OpenAI API Key for embeddings
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Get Lovable API Key for chat completion
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Step 1: Check for similar existing Q&A
    console.log('🔍 Checking for similar existing Q&A...');
    
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: question,
      }),
    });

    if (!embeddingResponse.ok) {
      console.error('❌ Embedding error:', embeddingResponse.status);
      if (embeddingResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Failed to generate question embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const questionEmbedding = embeddingData.data[0].embedding;

    // Get tenant_id
    const { data: userTenants } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!userTenants) {
      throw new Error('Unable to determine user tenant');
    }

    const tenantId = userTenants.tenant_id;

    // Check for existing similar Q&A (threshold 0.9 = very similar)
    const { data: similarQA } = await supabase.rpc(
      'match_similar_questions',
      {
        query_embedding: JSON.stringify(questionEmbedding),
        match_threshold: 0.9,
        match_count: 1,
        p_tenant_id: tenantId,
      }
    );

    if (similarQA && similarQA.length > 0 && similarQA[0].was_helpful) {
      console.log('✅ Found existing helpful answer, returning cached response');
      
      return new Response(
        JSON.stringify({
          success: true,
          answer: similarQA[0].answer_ar,
          confidence: 0.95,
          sources: [],
          is_cached: true,
          qa_id: similarQA[0].id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Find relevant documents using vector search
    console.log('📚 Searching for relevant knowledge documents...');
    
    const { data: relevantDocs, error: searchError } = await supabase.rpc(
      'match_knowledge_documents',
      {
        query_embedding: JSON.stringify(questionEmbedding),
        match_threshold: 0.7,
        match_count: maxSources,
        p_tenant_id: tenantId,
        p_document_type: null,
      }
    );

    if (searchError) {
      console.error('❌ Search error:', searchError);
      throw new Error('Failed to search knowledge base');
    }

    console.log(`📄 Found ${relevantDocs?.length || 0} relevant documents`);

    if (!relevantDocs || relevantDocs.length === 0) {
      // No relevant documents found
      return new Response(
        JSON.stringify({
          success: true,
          answer: language === 'ar' 
            ? 'عذراً، لم أتمكن من العثور على معلومات كافية للإجابة على سؤالك في قاعدة المعرفة الحالية. يرجى المحاولة بصياغة مختلفة أو التواصل مع الدعم الفني.'
            : 'Sorry, I could not find sufficient information to answer your question in the current knowledge base. Please try rephrasing or contact support.',
          confidence: 0,
          sources: [],
          is_insufficient_context: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Build context from relevant documents
    const contextText = relevantDocs
      .map((doc: any, idx: number) => {
        const content = language === 'ar' ? doc.content_ar : (doc.content_en || doc.content_ar);
        return `[مستند ${idx + 1}: ${doc.title_ar}]\n${content.substring(0, 1000)}`;
      })
      .join('\n\n---\n\n');

    console.log(`📝 Context built from ${relevantDocs.length} documents (${contextText.length} chars)`);

    // Step 4: Generate answer using Lovable AI with RAG
    console.log('🤖 Generating answer with AI...');
    
    const systemPrompt = language === 'ar'
      ? `أنت مساعد ذكي متخصص في الأمن السيبراني والحوكمة. مهمتك الإجابة على الأسئلة بناءً على المستندات المتاحة فقط.

قواعد مهمة:
1. استخدم فقط المعلومات الموجودة في المستندات المقدمة
2. إذا لم تجد الإجابة في المستندات، اذكر ذلك بوضوح
3. كن دقيقاً ومختصراً
4. أشر إلى المستندات المصدرية عند الحاجة
5. استخدم اللغة العربية الفصحى`
      : `You are an AI assistant specialized in Cybersecurity and Governance. Your task is to answer questions based ONLY on the provided documents.

Important rules:
1. Use only information from the provided documents
2. If the answer is not in the documents, clearly state that
3. Be accurate and concise
4. Reference source documents when needed
5. Use professional English`;

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
          {
            role: 'user',
            content: `السياق:\n${contextText}\n\nالسؤال: ${question}`,
          },
        ],
        temperature: 0.2, // Low temperature for factual accuracy
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      console.error('❌ AI generation error:', aiResponse.status);
      throw new Error('Failed to generate answer');
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;

    console.log(`✅ Answer generated (${answer.length} chars)`);

    // Step 5: Calculate confidence based on similarity scores
    const avgSimilarity = relevantDocs.reduce((sum: number, doc: any) => sum + doc.similarity, 0) / relevantDocs.length;
    const confidence = Math.min(avgSimilarity * 1.1, 0.95); // Slightly boost confidence

    // Step 6: Store Q&A in database
    const sourceDocIds = relevantDocs.map((doc: any) => doc.id);
    
    const { data: savedQA, error: saveError } = await supabase
      .from('knowledge_qa')
      .insert({
        tenant_id: tenantId,
        question_ar: language === 'ar' ? question : null,
        question_en: language === 'en' ? question : null,
        question_embedding: JSON.stringify(questionEmbedding),
        answer_ar: language === 'ar' ? answer : null,
        answer_en: language === 'en' ? answer : null,
        source_documents: sourceDocIds,
        confidence_score: confidence,
        model_used: 'google/gemini-2.5-flash',
        asked_by: user.id,
        metadata: {
          num_sources: relevantDocs.length,
          avg_similarity: avgSimilarity,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error('⚠️ Failed to save Q&A:', saveError);
      // Continue anyway, don't fail the request
    } else {
      console.log(`💾 Q&A saved with ID: ${savedQA.id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        confidence,
        sources: relevantDocs.map((doc: any) => ({
          id: doc.id,
          title: doc.title_ar,
          type: doc.document_type,
          category: doc.category,
          similarity: doc.similarity,
        })),
        qa_id: savedQA?.id,
        is_cached: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in knowledge-qa:', error);
    
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
