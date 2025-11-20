/**
 * M17: Knowledge Hub + RAG - Edge Function
 * Function: knowledge-embed
 * Purpose: Generate vector embeddings for text using Lovable AI
 * 
 * This function converts text (AR/EN) into vector embeddings for semantic search.
 * It uses Lovable AI's embedding capabilities to create 1536-dimension vectors.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmbedRequest {
  documentId?: string;
  text: string;
  tenant_id?: string;
  type?: 'document' | 'query';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 knowledge-embed: Starting embedding generation');
    
    const { documentId, text, tenant_id, type = 'document' }: EmbedRequest = await req.json();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required and cannot be empty');
    }

    // Validate text length (max 8000 chars for embedding models)
    if (text.length > 8000) {
      throw new Error('Text is too long. Maximum 8000 characters allowed.');
    }

    // Get OpenAI API Key for embeddings
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log(`📝 Generating embedding for text (${text.length} chars, type: ${type})`);

    // Call OpenAI directly for embeddings
    // Note: Using text-embedding-3-small (latest, better quality, cheaper)
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('❌ Lovable AI error:', embeddingResponse.status, errorText);
      
      if (embeddingResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (embeddingResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Lovable AI API error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    console.log(`✅ Successfully generated embedding (${embedding.length} dimensions)`);

    // If documentId is provided, save embedding to database
    if (documentId && tenant_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { error: updateError } = await supabase
          .from('knowledge_documents')
          .update({ embedding_vector: JSON.stringify(embedding) })
          .eq('id', documentId)
          .eq('tenant_id', tenant_id);
        
        if (updateError) {
          console.error('⚠️ Failed to save embedding to DB:', updateError);
        } else {
          console.log(`💾 Embedding saved to DB for document ${documentId}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        embedding,
        dimensions: embedding.length,
        text_length: text.length,
        type,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in knowledge-embed:', error);
    
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
